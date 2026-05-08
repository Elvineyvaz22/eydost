"""Basic health check tests for the FastAPI backend."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "eydost-esim-backend"


def test_openapi_docs(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "paths" in response.json()
