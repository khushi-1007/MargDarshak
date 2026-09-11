def test_create_and_get_order(client, auth_headers):
    payload = {
        "external_order_id": "ORD-TEST-01",
        "customer_name": "Test Customer",
        "customer_phone": "9999888877",
        "delivery_lat": 26.9124,
        "delivery_lng": 75.7873,
        "delivery_address": "Jaipur Center",
        "weight_kg": 25.5,
        "priority": "HIGH",
        "window_start": "10:00",
        "window_end": "14:00",
        "service_duration_minutes": 15
    }
    create_resp = client.post("/api/v1/orders", json=payload, headers=auth_headers)
    assert create_resp.status_code == 200
    res = create_resp.json()
    assert res["success"] is True
    order_id = res["data"]["id"]

    get_resp = client.get(f"/api/v1/orders/{order_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["priority"] == "HIGH"


def test_import_orders_csv(client, auth_headers):
    csv_content = (
        "external_order_id,customer_name,customer_phone,delivery_lat,delivery_lng,delivery_address,weight_kg,priority,window_start,window_end\n"
        "ORD-CSV-1,CSV Customer 1,9876543210,26.9066,75.7410,Vaishali Nagar,40,NORMAL,09:00,12:00\n"
        "ORD-CSV-2,CSV Customer 2,9876543211,26.8530,75.8150,Malviya Nagar,60,CRITICAL,10:00,13:00\n"
        "ORD-CSV-3,Bad Coords,9876543212,999.0,75.8150,Bad Location,10,LOW,09:00,12:00\n"
    )
    files = {"file": ("orders.csv", csv_content, "text/csv")}
    resp = client.post("/api/v1/orders/import", files=files, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["total_imported"] == 2
    assert data["failed_rows"] == 1
    assert "Invalid coordinates" in data["errors"][0]["error"]
