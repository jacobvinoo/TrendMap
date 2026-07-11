import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_api_version():
    response = client.get("/api/version")
    assert response.status_code == 200
    assert "version" in response.json()

def test_unknown_route():
    response = client.get("/this-route-does-not-exist")
    assert response.status_code == 404
