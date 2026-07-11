import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_industry_saves_json_arrays():
    payload = {
        "id": "ind-test",
        "name": "Integration Test Industry",
        "geography": "Global",
        "strategicPriorities": ["Priority A", "Priority B"],
        "customerSegments": ["Segment 1"],
        "competitors": [],
        "timeHorizons": ["1-3 years"]
    }
    
    response = client.post("/api/industries", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code} with body: {response.text}"
    
    data = response.json()
    assert data["name"] == "Integration Test Industry"
    assert data["strategicPriorities"] == ["Priority A", "Priority B"]

    # Verify it can be retrieved
    get_response = client.get("/api/industries")
    assert get_response.status_code == 200
    industries = get_response.json()
    assert any(ind["id"] == "ind-test" for ind in industries)

def test_create_industry_updates_context_fields_and_orders_by_update_time():
    base_payload = {
        "id": "ind-order-test",
        "name": "Order Test Industry",
        "geography": "New Zealand",
        "strategicPriorities": [],
        "customerSegments": [],
        "competitors": [],
        "timeHorizons": [],
    }
    newer_payload = {
        "id": "ind-order-empty",
        "name": "Order Test Industry Empty",
        "geography": "New Zealand",
        "strategicPriorities": [],
        "customerSegments": [],
        "competitors": [],
        "timeHorizons": [],
    }

    assert client.post("/api/industries", json=base_payload).status_code == 200
    assert client.post("/api/industries", json=newer_payload).status_code == 200

    update_response = client.post("/api/industries", json={
        **base_payload,
        "strategicPriorities": ["Growth", "Customer experience"],
        "customerSegments": ["Families"],
        "competitors": ["Countdown"],
        "timeHorizons": ["6 months", "18 months"],
    })
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["timeHorizons"] == ["6 months", "18 months"]

    industries = client.get("/api/industries").json()
    assert industries[0]["id"] == "ind-order-test"
    assert industries[0]["strategicPriorities"] == ["Growth", "Customer experience"]

def test_create_strategic_context_round_trips_list_fields():
    payload = {
        "id": "ctx-test",
        "industryProfileId": "ind-test",
        "companyName": "Strategy Test Co",
        "business_model": "Online grocery",
        "targetCustomers": ["Families", "Professionals"],
        "strategicGoals": ["Grow share"],
        "currentCapabilities": ["Search", "Recommendations"],
        "constraints": ["Capacity"],
        "riskAppetite": "high",
        "planningHorizons": ["6 months", "18 months"],
    }

    response = client.post("/api/strategic-contexts", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["companyName"] == "Strategy Test Co"
    assert data["targetCustomers"] == ["Families", "Professionals"]
    assert data["planningHorizons"] == ["6 months", "18 months"]

    update_response = client.post("/api/strategic-contexts", json={
        **payload,
        "planningHorizons": ["12 months"],
    })
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["planningHorizons"] == ["12 months"]

    contexts = client.get("/api/strategic-contexts").json()
    matching = [ctx for ctx in contexts if ctx["id"] == "ctx-test"]
    assert len(matching) == 1
    assert matching[0]["planningHorizons"] == ["12 months"]

def test_delete_source():
    # Create a source first
    payload = {
        "name": "Delete Me Source",
        "url": "http://deleteme.com",
        "source_type": "report",
        "industry_id": "ind-test"
    }
    response = client.post("/api/sources", json=payload)
    assert response.status_code == 200
    source_id = response.json()["id"]

    # Delete the source
    del_response = client.delete(f"/api/sources/{source_id}")
    assert del_response.status_code == 200
    assert del_response.json()["success"] == True

    # Verify it's gone
    get_response = client.get("/api/sources")
    assert get_response.status_code == 200
    sources = get_response.json()
    assert not any(s["id"] == source_id for s in sources)

def test_create_document_success():
    # Create a source first
    payload = {
        "name": "Doc Source",
        "url": "http://docsource.com",
        "source_type": "report"
    }
    response = client.post("/api/sources", json=payload)
    assert response.status_code == 200
    source_id = response.json()["id"]

    # Create document
    doc_payload = {
        "title": "Test Doc",
        "url": "http://docsource.com/doc",
        "content": "some content",
        "source_id": source_id
    }
    doc_resp = client.post("/api/documents", json=doc_payload)
    assert doc_resp.status_code == 200, f"Expected 200, got {doc_resp.status_code} with body: {doc_resp.text}"
    assert doc_resp.json()["status"] == "raw"
