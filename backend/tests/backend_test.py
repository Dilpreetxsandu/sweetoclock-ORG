"""SweetOClock backend API tests (mock-mode Razorpay/Twilio/Shiprocket)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://treat-payment.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "sandhuxe@gmail.com"
ADMIN_PASSWORD = "SweetOClock@123"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("token")
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Products (public) ----------
def test_list_products(s):
    r = s.get(f"{API}/products")
    assert r.status_code == 200
    products = r.json()
    assert isinstance(products, list) and len(products) >= 2
    names = {p["name"] for p in products}
    assert "Laddoo" in names and "Khajur Fudge" in names
    for p in products:
        assert "id" in p and "price_per_kg" in p
        assert "_id" not in p


# ---------- Auth ----------
def test_login_invalid(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_auth_me_requires_token(s):
    r = s.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_auth_me_with_token(s, admin_headers):
    r = s.get(f"{API}/auth/me", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


# ---------- Order flow (mock razorpay) ----------
@pytest.fixture(scope="session")
def placed_order(s):
    products = s.get(f"{API}/products").json()
    laddoo = next(p for p in products if p["name"] == "Laddoo")
    payload = {
        "customer": {
            "name": "TEST Buyer",
            "phone": "9876543210",
            "address": "12 Test Lane",
            "city": "Nagpur",
            "state": "Maharashtra",
            "pincode": "440001",
        },
        "items": [{"product_id": laddoo["id"], "weight_grams": 500, "qty": 2}],
    }
    r = s.post(f"{API}/orders/create", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    # 599 * 500/1000 * 2 = 599
    assert d["total"] == 599.0
    assert d["mock"] is True
    assert d["order_number"].startswith("SOC-")
    return d


def test_verify_payment_mock(s, placed_order):
    r = s.post(f"{API}/orders/verify", json={
        "order_id": placed_order["order_id"],
        "razorpay_order_id": placed_order["razorpay_order_id"],
        "razorpay_payment_id": "pay_mock_123",
        "razorpay_signature": "mock_signature",
    })
    assert r.status_code == 200, r.text
    order = r.json()
    assert order["status"] == "paid"
    assert order["invoice_channel"] == "pdf_fallback"


def test_verify_bad_signature(s):
    products = s.get(f"{API}/products").json()
    p = products[0]
    r = s.post(f"{API}/orders/create", json={
        "customer": {"name": "TEST X", "phone": "9000000000", "address": "a", "city": "b", "state": "c", "pincode": "111111"},
        "items": [{"product_id": p["id"], "weight_grams": 250, "qty": 1}],
    })
    assert r.status_code == 200
    o = r.json()
    r2 = s.post(f"{API}/orders/verify", json={
        "order_id": o["order_id"], "razorpay_order_id": o["razorpay_order_id"],
        "razorpay_payment_id": "x", "razorpay_signature": "bad",
    })
    assert r2.status_code == 400


def test_get_order(s, placed_order):
    r = s.get(f"{API}/orders/{placed_order['order_id']}")
    assert r.status_code == 200
    assert r.json()["order_number"] == placed_order["order_number"]


def test_invoice_pdf(s, placed_order):
    r = s.get(f"{API}/orders/{placed_order['order_id']}/invoice")
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("application/pdf")
    assert len(r.content) > 500


def test_track_order_ok(s, placed_order):
    r = s.get(f"{API}/orders/track", params={"order_number": placed_order["order_number"], "phone": "9876543210"})
    assert r.status_code == 200
    assert r.json()["status"] in ("paid", "packed", "shipped", "delivered")


def test_track_order_bad_phone(s, placed_order):
    r = s.get(f"{API}/orders/track", params={"order_number": placed_order["order_number"], "phone": "0000000000"})
    assert r.status_code == 404


# ---------- Admin: orders ----------
def test_admin_list_orders(s, admin_headers, placed_order):
    r = s.get(f"{API}/admin/orders", headers=admin_headers)
    assert r.status_code == 200
    orders = r.json()
    assert any(o["id"] == placed_order["order_id"] for o in orders)


def test_admin_update_status(s, admin_headers, placed_order):
    r = s.patch(f"{API}/admin/orders/{placed_order['order_id']}/status", headers=admin_headers, json={"status": "packed"})
    assert r.status_code == 200
    assert r.json()["status"] == "packed"


def test_admin_shiprocket_mock(s, admin_headers, placed_order):
    r = s.post(f"{API}/admin/orders/{placed_order['order_id']}/shiprocket", headers=admin_headers)
    assert r.status_code == 200
    ship = r.json()
    assert ship["awb"].startswith("MOCK")
    assert ship["mock"] is True


def test_admin_resend_invoice(s, admin_headers, placed_order):
    r = s.post(f"{API}/admin/orders/{placed_order['order_id']}/resend-invoice", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["channel"] == "pdf_fallback"


# ---------- Admin: products CRUD ----------
def test_admin_product_crud(s, admin_headers):
    payload = {"name": "TEST_Barfi", "description": "test", "price_per_kg": 799, "image_url": "", "tag": "test", "active": True}
    r = s.post(f"{API}/admin/products", headers=admin_headers, json=payload)
    assert r.status_code == 200
    p = r.json()
    pid = p["id"]
    # appears in public listing
    pub = s.get(f"{API}/products").json()
    assert any(x["id"] == pid for x in pub)
    # update
    payload["price_per_kg"] = 850
    r = s.put(f"{API}/admin/products/{pid}", headers=admin_headers, json=payload)
    assert r.status_code == 200
    assert r.json()["price_per_kg"] == 850
    # delete
    r = s.delete(f"{API}/admin/products/{pid}", headers=admin_headers)
    assert r.status_code == 200
    pub = s.get(f"{API}/products").json()
    assert not any(x["id"] == pid for x in pub)


def test_admin_requires_auth():
    r = requests.get(f"{API}/admin/orders")
    assert r.status_code == 401
