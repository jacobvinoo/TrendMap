import pytest
import chromadb
from app.services.vector_store import VectorStore

@pytest.fixture
def store():
    # Use ephemeral client for isolated tests
    vs = VectorStore.__new__(VectorStore)
    vs.client = chromadb.Client()
    vs.collection = vs.client.get_or_create_collection("document_chunks")
    return vs

def test_vector_store_add_and_search(store):
    chunks = [
        "The quick brown fox jumps over the lazy dog.",
        "Artificial intelligence is transforming industries.",
        "Climate change leads to extreme weather events."
    ]
    doc_id = "test-doc-1"
    store.add_document_chunks(doc_id, chunks)
    
    # Query related to AI
    results = store.semantic_search("AI and machine learning", doc_id, top_k=1)
    assert len(results) == 1
    assert "Artificial intelligence" in results[0]
    
    # Query related to animals
    results = store.semantic_search("Canines and felines", doc_id, top_k=1)
    assert len(results) == 1
    assert "fox jumps over" in results[0]

def test_vector_store_search_empty(store):
    results = store.semantic_search("AI", "nonexistent-doc")
    assert results == []
