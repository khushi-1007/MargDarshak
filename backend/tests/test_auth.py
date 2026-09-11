from app.core.security import verify_password, get_password_hash


def test_password_hashing():
    pw = "SuperSecretPassword123"
    hashed = get_password_hash(pw)
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_auth_register_and_login(client):
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": "New Dispatcher",
        "email": "newdispatch@test.com",
        "password": "mypassword123",
        "role": "dispatcher"
    })
    assert reg_resp.status_code == 200
    data = reg_resp.json()
    assert data["success"] is True
    assert data["data"]["email"] == "newdispatch@test.com"

    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "newdispatch@test.com",
        "password": "mypassword123"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data["data"]

    # Test /me
    token = login_data["data"]["access_token"]
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["name"] == "New Dispatcher"
