from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
from pathlib import Path

# Add app to path
sys.path.append(str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)

@patch("app.routers.chat.classify_severity")
@patch("app.routers.chat.generate_embedding")
@patch("app.routers.chat.search_techniques")
@patch("app.routers.chat.generate_response")
def test_chat_endpoint(mock_generate_response, mock_search_techniques, mock_generate_embedding, mock_classify_severity):
    # Setup mocks
    mock_classify_severity.return_value = "LOW"
    mock_generate_embedding.return_value = [0.1] * 768
    mock_search_techniques.return_value = [
        {
            "title": "Test Technique",
            "content": "Test Content",
            "instructions": ["Step 1"],
            "embedding": [0.1] * 768
        }
    ]
    mock_generate_response.return_value = "This is a test response."

    # Test request
    response = client.post("/chat", json={"message": "I feel stressed"})

    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "This is a test response."
    assert data["severity"] == "LOW"
    assert len(data["techniques"]) == 1
    assert data["techniques"][0]["title"] == "Test Technique"

@patch("app.routers.chat.classify_severity")
@patch("app.routers.chat.generate_embedding")
@patch("app.routers.chat.search_techniques")
@patch("app.routers.chat.get_crisis_resources")
@patch("app.routers.chat.generate_response")
def test_chat_endpoint_crisis(mock_generate_response, mock_get_crisis_resources, mock_search_techniques, mock_generate_embedding, mock_classify_severity):
    # Setup mocks for crisis
    mock_classify_severity.return_value = "CRISIS"
    mock_generate_embedding.return_value = [0.1] * 768
    mock_search_techniques.return_value = []
    mock_get_crisis_resources.return_value = [
        {
            "name": "Crisis Line",
            "phone": "123-456"
        }
    ]
    mock_generate_response.return_value = "Please call this number."

    # Test request
    response = client.post("/chat", json={"message": "I want to hurt myself"})

    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["severity"] == "CRISIS"
    assert len(data["crisis_resources"]) == 1
    assert data["crisis_resources"][0]["name"] == "Crisis Line"
