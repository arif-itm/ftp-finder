from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

# Mock Supabase client
mock_supabase = MagicMock()

@patch("main.supabase", mock_supabase)
def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "FTP Finder Backend is running"}

@patch("main.supabase", mock_supabase)
def test_search_directories():
    # Mock response data for directories
    mock_supabase.table.return_value.select.return_value.ilike.return_value.execute.return_value.data = [
        {"id": 1, "name": "test_dir", "path": "/test_dir", "original_link": "ftp://example.com/test_dir/"}
    ]
    
    response = client.get("/search?q=test")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "test_dir"

@patch("main.supabase", mock_supabase)
def test_add_source():
    # Mock response data
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": 1, "label": "Test Source", "url": "ftp://test.com", "created_at": "2024-01-01T00:00:00Z"}
    ]

    response = client.post("/sources", json={"label": "Test Source", "url": "ftp://test.com"})
    assert response.status_code == 200
    data = response.json()
    assert data["label"] == "Test Source"
    assert data["url"] == "ftp://test.com"

@patch("main.supabase", mock_supabase)
def test_trigger_index():
    response = client.post("/index")
    assert response.status_code == 200
    assert response.json() == {"message": "Indexing started in background"}
