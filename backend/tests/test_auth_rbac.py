import pytest
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User, UserRole


def test_password_security():
    plain = "SuperSecure#2026"
    hashed = get_password_hash(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword#999", hashed) is False


def test_auth_login_invalid_credentials(client, db_session):
    resp = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@user.com",
        "password": "somepassword"
    })
    assert resp.status_code == 401


def test_protected_routes_unauthenticated(client):
    # Orders
    assert client.get("/api/v1/orders").status_code == 401
    assert client.post("/api/v1/orders", json={}).status_code == 401
    # Vehicles
    assert client.get("/api/v1/vehicles").status_code == 401
    assert client.post("/api/v1/vehicles", json={}).status_code == 401
    # Drivers
    assert client.get("/api/v1/drivers").status_code == 401
    # Analytics
    assert client.get("/api/v1/analytics/overview").status_code == 401
    # Reoptimise
    assert client.post("/api/v1/optimisation/reoptimise", json={}).status_code == 401


def test_invalid_and_expired_jwt(client):
    invalid_headers = {"Authorization": "Bearer invalid.jwt.token"}
    resp = client.get("/api/v1/auth/me", headers=invalid_headers)
    assert resp.status_code == 401


def test_rbac_driver_forbidden_from_dispatcher_operations(client, db_session):
    # Register a driver
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": "Fleet Driver One",
        "email": "driver1@fleet.com",
        "password": "driverpass123",
        "role": "driver"
    })
    assert reg_resp.status_code == 200

    # Login to obtain access token
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "driver1@fleet.com",
        "password": "driverpass123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["data"]["access_token"]
    driver_headers = {"Authorization": f"Bearer {token}"}

    # Driver CAN access /auth/me
    me_resp = client.get("/api/v1/auth/me", headers=driver_headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["role"] == "driver"

    # Driver CANNOT create a vehicle (dispatcher/admin only)
    v_resp = client.post("/api/v1/vehicles", json={
        "vehicle_number": "RJ-14-DRV-01",
        "vehicle_type": "LIGHT_COMMERCIAL",
        "capacity_kg": 500.0,
        "fuel_type": "DIESEL",
        "cost_per_km": 10.0,
        "fuel_cost_per_km": 5.0
    }, headers=driver_headers)
    assert v_resp.status_code == 403

    # Driver CANNOT trigger re-optimisation
    opt_resp = client.post("/api/v1/optimisation/reoptimise", json={
        "trigger": "MANUAL"
    }, headers=driver_headers)
    assert opt_resp.status_code == 403

    # Driver CANNOT view analytics overview
    an_resp = client.get("/api/v1/analytics/overview", headers=driver_headers)
    assert an_resp.status_code == 403
