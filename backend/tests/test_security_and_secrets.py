import pytest
from app.config import settings
from app.models.user import User


def test_secrets_not_exposed_in_user_responses(client, auth_headers):
    me_resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_resp.status_code == 200
    user_data = me_resp.json()["data"]

    # Sensitive fields must never be exposed in API payload
    assert "hashed_password" not in user_data
    assert "password" not in user_data
    assert "jwt_secret" not in user_data
    assert "secret" not in user_data

    # Environment secrets must never leak in serialized responses
    response_text = me_resp.text
    assert settings.JWT_SECRET not in response_text
    if settings.SARVAM_API_KEY:
        assert settings.SARVAM_API_KEY not in response_text


def test_sql_injection_resilience(client, auth_headers):
    # Try SQL injection in order search filter
    sqli_payload = "' OR 1=1; --"
    resp = client.get(f"/api/v1/orders?search={sqli_payload}", headers=auth_headers)
    # Must handle gracefully with 200, never a 500 DB crash
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_path_traversal_resilience(client, auth_headers):
    # Malicious order ID with path traversal
    bad_id = "../../../../etc/passwd"
    resp = client.get(f"/api/v1/orders/{bad_id}", headers=auth_headers)
    # Should safely return 404 or 422, never 500
    assert resp.status_code in [404, 422]
