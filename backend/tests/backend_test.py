"""SweetOClock backend tests (unit-based pricing model)."""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://treat-payment.preview.emergentagent.com"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "sandhuxe@gmail.com"
ADMIN_PASSWORD = "SweetOClock@123"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def products(s):
    r = s.get(f"{API}/products", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 8
    return data


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# Products
class TestProducts:
    def test_list_has_8_seeded(self, products):
        slugs = {p["slug"] for p in products}
        for expected in ["kaju-katli", "motichoor-ladoo", "gulab-jamun", "rasgulla",
                          "jalebi", "besan-barfi", "dry-fruit-laddu", "festive-hamper"]:
            assert expected in slugs

    def test_product_shape(self, products):
        p = products[0]
        for k in ["id", "name", "slug", "price", "unit", "image", "category"]:
            assert k in p
        assert "_id" not in p


# Order flow
class TestOrderFlow:
    def test_create_verify_track_invoice(self, s, products):
        kaju = next(p for p in products if p["slug"] == "kaju-katli")
        payload = {
            "customer": {
                "name": "TEST_Buyer One",
                "phone": "9876543210",
                "address": "10 Test Street",
                "city": "Nagpur",
                "state": "Maharashtra",
                "pincode": "440001",
            },
            "items": [{"product_id": kaju["id"], "qty": 2}],
        }
        r = s.post(f"{API}/orders/create", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["mock"] is True
        # 2 * 499 = 998 -> free delivery
        assert d["total"] == 998.0
        order_id = d["order_id"]
        rzp_oid = d["razorpay_order_id"]
        order_number = d["order_number"]
        assert order_number.startswith("SOC-")

        # Verify
        vr = s.post(f"{API}/orders/verify", json={
            "order_id": order_id,
            "razorpay_order_id": rzp_oid,
            "razorpay_payment_id": "pay_mock_123",
            "razorpay_signature": "mock_signature",
        }, timeout=15)
        assert vr.status_code == 200, vr.text
        vd = vr.json()
        assert vd["status"] == "paid"
        assert vd["invoice_channel"] in ("pdf_fallback", "whatsapp")

        # Bad signature test on a fresh order
        r2 = s.post(f"{API}/orders/create", json=payload, timeout=15)
        d2 = r2.json()
        bad = s.post(f"{API}/orders/verify", json={
            "order_id": d2["order_id"],
            "razorpay_order_id": d2["razorpay_order_id"],
            "razorpay_payment_id": "pay_x",
            "razorpay_signature": "wrong_sig",
        }, timeout=15)
        assert bad.status_code == 400

        # Track
        tr = s.get(f"{API}/orders/track", params={"order_number": order_number, "phone": "9876543210"}, timeout=15)
        assert tr.status_code == 200
        assert tr.json()["status"] == "paid"

        # Track wrong phone
        tr_bad = s.get(f"{API}/orders/track", params={"order_number": order_number, "phone": "0000000000"}, timeout=15)
        assert tr_bad.status_code == 404

        # Invoice
        ir = s.get(f"{API}/orders/{order_id}/invoice", timeout=20)
        assert ir.status_code == 200
        assert ir.headers.get("content-type", "").startswith("application/pdf")

        return order_id

    def test_delivery_fee_under_threshold(self, s, products):
        jalebi = next(p for p in products if p["slug"] == "jalebi")  # 199
        payload = {
            "customer": {"name": "TEST_Under", "phone": "9000000001", "address": "x",
                         "city": "N", "state": "MH", "pincode": "440001"},
            "items": [{"product_id": jalebi["id"], "qty": 1}],
        }
        r = s.post(f"{API}/orders/create", json=payload, timeout=15)
        d = r.json()
        assert d["total"] == 199.0 + 79.0

    def test_invalid_qty(self, s, products):
        p = products[0]
        r = s.post(f"{API}/orders/create", json={
            "customer": {"name": "T", "phone": "9000000002", "address": "x", "city": "N", "state": "MH", "pincode": "440001"},
            "items": [{"product_id": p["id"], "qty": 0}],
        }, timeout=15)
        assert r.status_code == 400

    def test_empty_cart(self, s):
        r = s.post(f"{API}/orders/create", json={
            "customer": {"name": "T", "phone": "9000000002", "address": "x", "city": "N", "state": "MH", "pincode": "440001"},
            "items": [],
        }, timeout=15)
        assert r.status_code == 400


# Auth
class TestAuth:
    def test_login_success(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_login_wrong_password(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_requires_auth(self, s):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_bearer(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# Admin
class TestAdmin:
    def test_admin_orders_list(self, admin_headers):
        r = requests.get(f"{API}/admin/orders", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_products_crud(self, admin_headers):
        payload = {
            "name": "TEST_UnitProd",
            "price": 250,
            "unit": "500g",
            "image": "https://example.com/x.jpg",
            "category": "Signature",
            "badge": "TEST",
            "tagline": "just testing",
        }
        c = requests.post(f"{API}/admin/products", headers=admin_headers, json=payload, timeout=15)
        assert c.status_code == 200, c.text
        pid = c.json()["id"]
        assert c.json()["slug"] == "test-unitprod"

        # Update
        payload["price"] = 299
        u = requests.put(f"{API}/admin/products/{pid}", headers=admin_headers, json=payload, timeout=15)
        assert u.status_code == 200
        assert u.json()["price"] == 299

        # Appears on public list
        pub = requests.get(f"{API}/products", timeout=15).json()
        assert any(p["id"] == pid for p in pub)

        # Delete
        d = requests.delete(f"{API}/admin/products/{pid}", headers=admin_headers, timeout=15)
        assert d.status_code == 200

    def test_admin_order_status_and_shiprocket(self, s, products, admin_headers):
        kaju = next(p for p in products if p["slug"] == "kaju-katli")
        r = s.post(f"{API}/orders/create", json={
            "customer": {"name": "TEST_ShipTest", "phone": "9111111111", "address": "x",
                          "city": "Nagpur", "state": "MH", "pincode": "440001"},
            "items": [{"product_id": kaju["id"], "qty": 2}],
        }, timeout=15)
        oid = r.json()["order_id"]
        rzp = r.json()["razorpay_order_id"]
        s.post(f"{API}/orders/verify", json={
            "order_id": oid, "razorpay_order_id": rzp,
            "razorpay_payment_id": "p", "razorpay_signature": "mock_signature",
        }, timeout=15)

        # Update status
        st = requests.patch(f"{API}/admin/orders/{oid}/status", headers=admin_headers,
                             json={"status": "packed"}, timeout=15)
        assert st.status_code == 200
        assert st.json()["status"] == "packed"

        # Shiprocket mock
        sp = requests.post(f"{API}/admin/orders/{oid}/shiprocket", headers=admin_headers, timeout=15)
        assert sp.status_code == 200
        assert sp.json()["awb"].startswith("MOCK")

        # Resend invoice
        ri = requests.post(f"{API}/admin/orders/{oid}/resend-invoice", headers=admin_headers, timeout=15)
        assert ri.status_code == 200
        assert ri.json()["channel"] in ("pdf_fallback", "whatsapp")
