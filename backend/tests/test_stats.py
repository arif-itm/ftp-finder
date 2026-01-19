from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app, get_stats

client = TestClient(app)
mock_supabase = MagicMock()

@patch("main.supabase", mock_supabase)
def test_stats_endpoint():
    # Mock counts
    mock_supabase.table.return_value.select.return_value.execute.return_value.count = 5
    # Mock last update
    mock_supabase.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value.data = [{"created_at": "2024-01-01T00:00:00Z"}]

    response = client.get("/stats")
    assert response.status_code == 200
    data = response.json()
    assert "sources" in data
    assert "directories" in data
    assert "last_updated" in data
