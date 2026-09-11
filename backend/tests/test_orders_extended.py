import io
import pytest
from app.models.order import Order, OrderPriority, OrderStatus


def test_order_creation_valid(client, auth_headers):
    payload = {
        "external_order_id": "ORD-EXT-VAL-001",
        "customer_name": "Valid Customer",
        "customer_phone": "9876543210",
        "delivery_lat": 26.9124,
        "delivery_lng": 75.7873,
        "delivery_address": "C-Scheme, Jaipur",
        "weight_kg": 25.0,
        "priority": "HIGH",
        "window_start": "09:00",
        "window_end": "12:00",
        "service_duration_minutes": 15
    }
    resp = client.post("/api/v1/orders", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["external_order_id"] == "ORD-EXT-VAL-001"
    assert data["priority"] == "HIGH"


def test_order_start_time_after_end_time_rejected(client, auth_headers):
    # window_start > window_end is invalid
    payload = {
        "external_order_id": "ORD-INV-TIME-001",
        "customer_name": "Invalid Window",
        "customer_phone": "9876543210",
        "delivery_lat": 26.9124,
        "delivery_lng": 75.7873,
        "delivery_address": "Jaipur",
        "weight_kg": 10.0,
        "priority": "NORMAL",
        "window_start": "14:00",
        "window_end": "10:00",
        "service_duration_minutes": 10
    }
    resp = client.post("/api/v1/orders", json=payload, headers=auth_headers)
    assert resp.status_code == 422


def test_order_invalid_weight_rejected(client, auth_headers):
    payload = {
        "external_order_id": "ORD-INV-WEIGHT-001",
        "customer_name": "Invalid Weight",
        "customer_phone": "9876543210",
        "delivery_lat": 26.9124,
        "delivery_lng": 75.7873,
        "delivery_address": "Jaipur",
        "weight_kg": -5.0,
        "priority": "NORMAL",
        "window_start": "09:00",
        "window_end": "12:00"
    }
    resp = client.post("/api/v1/orders", json=payload, headers=auth_headers)
    assert resp.status_code == 422


def test_duplicate_external_order_id_rejected(client, auth_headers):
    payload = {
        "external_order_id": "ORD-DUP-001",
        "customer_name": "Customer One",
        "customer_phone": "9876543210",
        "delivery_lat": 26.9124,
        "delivery_lng": 75.7873,
        "delivery_address": "Jaipur",
        "weight_kg": 15.0,
        "priority": "NORMAL",
        "window_start": "09:00",
        "window_end": "12:00"
    }
    resp1 = client.post("/api/v1/orders", json=payload, headers=auth_headers)
    assert resp1.status_code == 200

    resp2 = client.post("/api/v1/orders", json=payload, headers=auth_headers)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]


def test_csv_import_malformed_and_partial_validation(client, auth_headers):
    # Malformed CSV missing headers
    bad_csv = "this,is,not,a,valid,header\n1,2,3,4,5,6"
    resp = client.post(
        "/api/v1/orders/import-csv",
        files={"file": ("orders.csv", io.BytesIO(bad_csv.encode("utf-8")), "text/csv")},
        headers=auth_headers
    )
    assert resp.status_code == 400

    # Partially valid CSV: 1 valid order, 1 with window_start > window_end, 1 with missing coordinates
    mixed_csv = """external_order_id,customer_name,customer_phone,delivery_lat,delivery_lng,delivery_address,weight_kg,priority,window_start,window_end,service_duration_minutes
ORD-CSV-OK,Valid User,9876543210,26.9124,75.7873,Jaipur,20.0,NORMAL,09:00,12:00,10
ORD-CSV-BADTIME,Time User,9876543210,26.9124,75.7873,Jaipur,20.0,NORMAL,15:00,11:00,10
ORD-CSV-NOCOORDS,No Coords,9876543210,,,Jaipur,20.0,NORMAL,09:00,12:00,10
"""
    resp_mixed = client.post(
        "/api/v1/orders/import-csv",
        files={"file": ("orders.csv", io.BytesIO(mixed_csv.encode("utf-8")), "text/csv")},
        headers=auth_headers
    )
    assert resp_mixed.status_code == 200
    data = resp_mixed.json()["data"]
    assert data["total_imported"] == 1
    assert data["failed_rows"] == 2
    assert len(data["errors"]) == 2


def test_order_invalid_status_transition(client, auth_headers):
    # Create order
    payload = {
        "external_order_id": "ORD-TRANS-001",
        "customer_name": "Transition Tester",
        "customer_phone": "9876543210",
        "delivery_lat": 26.9124,
        "delivery_lng": 75.7873,
        "delivery_address": "Jaipur",
        "weight_kg": 15.0,
        "priority": "NORMAL",
        "window_start": "09:00",
        "window_end": "12:00"
    }
    resp = client.post("/api/v1/orders", json=payload, headers=auth_headers)
    order_id = resp.json()["data"]["id"]

    # Transition to ASSIGNED -> IN_TRANSIT -> DELIVERED
    client.patch(f"/api/v1/orders/{order_id}", json={"status": "ASSIGNED"}, headers=auth_headers)
    client.patch(f"/api/v1/orders/{order_id}", json={"status": "IN_TRANSIT"}, headers=auth_headers)
    deliv_resp = client.patch(f"/api/v1/orders/{order_id}", json={"status": "DELIVERED"}, headers=auth_headers)
    assert deliv_resp.status_code == 200

    # Transitioning from DELIVERED back to PENDING must be rejected
    illegal_resp = client.patch(f"/api/v1/orders/{order_id}", json={"status": "PENDING"}, headers=auth_headers)
    assert illegal_resp.status_code in [400, 409]
    err_body = illegal_resp.json()
    err_msg = err_body.get("detail") or err_body.get("error", {}).get("message", "")
    assert "Invalid status transition" in err_msg or "INVALID_STATE_TRANSITION" in str(err_body)
