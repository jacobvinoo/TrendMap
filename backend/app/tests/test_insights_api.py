import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import engine, SessionLocal
from app.models.core import Trend, TrendStatus, Base

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Create test trends
    t1 = Trend(id="t1", name="Approved Trend", status=TrendStatus.approved, impact_score=0.9, confidence_score=0.8)
    t2 = Trend(id="t2", name="Candidate Trend", status=TrendStatus.candidate, impact_score=0.9, confidence_score=0.8)
    t3 = Trend(id="t3", name="Watch Item", status=TrendStatus.approved, impact_score=0.8, confidence_score=0.5)
    t4 = Trend(id="t4", name="Emerging Risk", status=TrendStatus.approved, impact_score=0.8, confidence_score=0.8, blockers=["Risk A"])
    t5 = Trend(id="t5", name="Opportunity", status=TrendStatus.approved, impact_score=0.8, confidence_score=0.8, recommended_actions=["Action B"])
    
    db.add_all([t1, t2, t3, t4, t5])
    db.commit()
    yield
    db.query(Trend).delete()
    db.commit()
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_get_insights_summary():
    response = client.get("/api/insights/summary")
    assert response.status_code == 200
    data = response.json()
    
    assert data["industry_profile_id"] == "default"
    assert "t1" in data["id"]
    
    # Key trends (top 2 approved by impact)
    key_trend_names = [t["name"] for t in data["key_trends"]]
    assert "Approved Trend" in key_trend_names
    assert "Candidate Trend" not in key_trend_names
    
    # Watch items (impact >= 0.7, conf < 0.7)
    watch_names = [t["name"] for t in data["watch_items"]]
    assert "Watch Item" in watch_names
    
    # Emerging risks (has blockers)
    risk_names = [t["name"] for t in data["emerging_risks"]]
    assert "Emerging Risk" in risk_names
    
    # Opportunities (has recommended actions)
    opp_names = [t["name"] for t in data["opportunities"]]
    assert "Opportunity" in opp_names
