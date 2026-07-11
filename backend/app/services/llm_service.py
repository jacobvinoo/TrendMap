import os
import instructor
from openai import OpenAI
from pydantic import BaseModel
from typing import List
from app.schemas.core import IndustryOut, SourceCreate, SignalCreate, TrendCreate

# Initialize the instructor-patched OpenAI client
# It will automatically pick up the OPENAI_API_KEY environment variable.
_client = None

def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it to use LLM extraction features.")
        _client = instructor.from_openai(OpenAI(api_key=api_key))
    return _client

class SourceList(BaseModel):
    sources: List[SourceCreate]

class SignalList(BaseModel):
    signals: List[SignalCreate]

class TrendList(BaseModel):
    trends: List[TrendCreate]

def discover_sources(industry_profile: IndustryOut) -> List[SourceCreate]:
    """
    Generate a list of recommended sources based on the industry profile.
    """
    if os.environ.get("E2E_TEST") == "1":
        return [
            SourceCreate(
                name="Gartner Magic Quadrant - AI",
                url="https://gartner.com/ai",
                source_type="Report"
            ),
            SourceCreate(
                name="TechCrunch - Future of Search",
                url="https://techcrunch.com/search",
                source_type="News"
            )
        ]
        
    client = get_client()
    
    prompt = f"""
    You are an expert industry analyst looking for high-quality information sources.
    Given the following industry profile, recommend 3 to 5 real-world sources (URLs) that would be highly relevant for trend spotting.
    Sources can be industry publications, academic journals, market research sites, or reputable news outlets.
    
    Industry Name: {industry_profile.name}
    Description: {industry_profile.description or 'N/A'}
    Geography: {industry_profile.geography or 'N/A'}
    Strategic Priorities: {', '.join(industry_profile.strategic_priorities or [])}
    
    Ensure the URLs are realistic and point to real domains. The source_type should be one of 'news', 'academic', 'report', 'publication', or 'pr'.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        response_model=SourceList,
        messages=[
            {"role": "system", "content": "You are a specialized trend forecasting API."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    
    return response.sources

from app.services.vector_store import get_vector_store

def extract_signals(document_text: str, document_id: str, source_id: str) -> List[SignalCreate]:
    """
    Extract structured Signals from raw document text by semantically searching for relevant chunks.
    """
    client = get_client()
    
    # Query vector store for most relevant chunks
    vs = get_vector_store()
    relevant_chunks = vs.semantic_search(
        query="emerging trends, technological shifts, consumer behavior changes, and market signals", 
        document_id=document_id, 
        top_k=5
    )
    
    if relevant_chunks:
        analysis_text = "\n\n...\n\n".join(relevant_chunks)
    else:
        # Fallback to truncated text if chunks are not found
        analysis_text = document_text[:12000]
        
    prompt = f"""
    Analyze the following document excerpts and extract discrete "Signals" of emerging trends or shifts.
    A signal is a specific piece of evidence—a new technology, a shift in consumer behavior, an economic indicator, or a regulatory change.
    
    Document Excerpts:
    {analysis_text}
    
    For each signal you extract, provide a concise title, a summary, a type (e.g., 'technology', 'consumer', 'economic', 'regulatory'), a PESTLE category, and assign scores (0.0 to 1.0) for novelty, strength, and confidence.
    Ensure you assign the provided document_id '{document_id}' and source_id '{source_id}' to every extracted signal.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        response_model=SignalList,
        messages=[
            {"role": "system", "content": "You are a specialized trend forecasting API that strictly adheres to the requested schema."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    
    return response.signals

def generate_trends(signals: List[dict]) -> List[TrendCreate]:
    """
    Cluster existing signals into broader Trends.
    """
    client = get_client()
    
    signals_text = "\\n\\n".join([f"Signal: {s.get('title')}\\nSummary: {s.get('summary')}" for s in signals])
    
    prompt = f"""
    You are a strategic foresight analyst. Look at the following recently extracted signals and cluster them into 1 to 3 broader "Trends".
    A trend is a directional shift that is larger than any single signal.
    
    Signals:
    {signals_text}
    
    For each trend, provide a name, a summary, a horizon (e.g. 'short', 'medium', 'long'), a maturity stage ('emerging', 'growth', 'mature'), and assign scores (0.0 to 1.0) for likelihood, confidence, and impact.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        response_model=TrendList,
        messages=[
            {"role": "system", "content": "You are a specialized trend forecasting API."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
    )
    
    return response.trends
