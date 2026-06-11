"""
SOLE Premium Footwear - Backend integration tests.
Covers: auth (register, login, me, logout, lockout), products, demo orders,
tracking, Stripe checkout session/status, and Google OAuth session infra.
"""
import os
import time
import uuid
import pytest
import requests
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://premium-kicks-573.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

SEED_EMAIL = "john@sole.com"
SEED_PASS = "Password123"

# Direct mongo handle for OAuth seed test
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


# ------------------------------ fixtures ------------------------------
@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session(http):
    """Authenticated session (cookies) for seeded user."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": SEED_EMAIL, "password": SEED_PASS})
    assert r.status_code == 200, f"Seed login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def mongo():
    cli = MongoClient(MONGO_URL)
    yield cli[DB_NAME]
    cli.close()


# ------------------------------ Products ------------------------------
class TestProducts:
    def test_list_products(self, http):
        r = http.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 6, f"Expected 6 products got {len(data)}"
        for p in data:
            assert "id" in p and "name" in p and "price" in p
            assert "colors" in p and isinstance(p["colors"], list)
            assert len(p["colors"]) == 5, f"{p['id']} colors={len(p['colors'])}"
            for c in p["colors"]:
                assert {"name", "hex", "filter"} <= set(c.keys())

    def test_get_product(self, http):
        r = http.get(f"{API}/products/p1")
        assert r.status_code == 200
        assert r.json()["id"] == "p1"

    def test_get_product_404(self, http):
        r = http.get(f"{API}/products/nope")
        assert r.status_code == 404


# ------------------------------ Auth ----------------------------------
class TestAuth:
    def test_login_seeded_user(self, http):
        r = http.post(f"{API}/auth/login", json={"email": SEED_EMAIL, "password": SEED_PASS})
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == SEED_EMAIL
        assert body["role"] == "customer"
        assert "access_token" in r.cookies or any("access_token" in c.name for c in r.cookies)

    def test_me_with_cookies(self, auth_session):
        r = auth_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == SEED_EMAIL

    def test_me_unauthenticated(self, http):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_login_wrong_password(self, http):
        r = http.post(f"{API}/auth/login", json={
            "email": f"throw_{uuid.uuid4().hex[:6]}@example.com", "password": "badpass"
        })
        assert r.status_code == 401

    def test_register_and_me(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        email = f"test_user_{uuid.uuid4().hex[:8]}@sole-test.com"
        r = s.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "Password123"})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["email"] == email
        # /me using cookies set on register
        r2 = s.get(f"{API}/auth/me")
        assert r2.status_code == 200
        assert r2.json()["email"] == email
        # logout clears
        r3 = s.post(f"{API}/auth/logout")
        assert r3.status_code == 200
        # cleanup
        cli = MongoClient(MONGO_URL)
        cli[DB_NAME].users.delete_one({"email": email})
        cli.close()

    def test_register_duplicate(self, http):
        r = http.post(f"{API}/auth/register", json={"name": "Dup", "email": SEED_EMAIL, "password": "Password123"})
        assert r.status_code == 400

    def test_bearer_token_auth(self):
        """Login, then use Bearer access_token header to call /me."""
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": SEED_EMAIL, "password": SEED_PASS})
        assert r.status_code == 200
        token = s.cookies.get("access_token")
        assert token, "access_token cookie missing"
        r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 200
        assert r2.json()["email"] == SEED_EMAIL

    def test_lockout_after_5_failures(self):
        """Use a throwaway email so we don't lock the seeded user."""
        throwaway = f"lockout_{uuid.uuid4().hex[:8]}@throwaway.com"
        # Pre-create the user with known wrong-password attempts
        # First create user
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        s.post(f"{API}/auth/register", json={"name": "Lock", "email": throwaway, "password": "Correct123"})
        # Try 5 wrong logins
        last = None
        for _ in range(5):
            last = requests.post(f"{API}/auth/login",
                                 json={"email": throwaway, "password": "Wrong"})
            assert last.status_code in (401, 429)
        # 6th should be 429
        r6 = requests.post(f"{API}/auth/login", json={"email": throwaway, "password": "Wrong"})
        assert r6.status_code == 429, f"Expected 429 lockout got {r6.status_code}: {r6.text}"
        # cleanup
        cli = MongoClient(MONGO_URL)
        cli[DB_NAME].users.delete_one({"email": throwaway})
        cli[DB_NAME].login_attempts.delete_many({"identifier": {"$regex": throwaway}})
        cli.close()


# ------------------------------ Google OAuth session infra ------------
class TestGoogleSessionInfra:
    def test_session_token_bearer_auth(self, mongo):
        """Seed a user + session_token directly in mongo, then use Bearer to call /me."""
        user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        session_token = f"test_session_{uuid.uuid4().hex}"
        email = f"test.user.{uuid.uuid4().hex[:6]}@example.com"
        mongo.users.insert_one({
            "user_id": user_id, "email": email, "name": "OAuth Tester",
            "picture": "", "role": "customer", "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        mongo.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {session_token}"})
            assert r.status_code == 200, r.text
            assert r.json()["email"] == email
        finally:
            mongo.users.delete_one({"user_id": user_id})
            mongo.user_sessions.delete_one({"session_token": session_token})


# ------------------------------ Orders --------------------------------
SAMPLE_SHIPPING = {
    "name": "John Doe", "phone": "5551234567",
    "address": "1 Test Way", "city": "Boston", "zip_code": "02101",
}


class TestOrders:
    def test_orders_requires_auth(self):
        r = requests.get(f"{API}/orders")
        assert r.status_code == 401

    def test_create_demo_order_under_100(self, auth_session):
        body = {"items": [{"product_id": "p5", "quantity": 1}], "shipping": SAMPLE_SHIPPING}
        r = auth_session.post(f"{API}/orders", json=body)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["status"] == "paid"
        assert order["subtotal"] == 90.0
        assert order["shipping_fee"] == 8.0
        assert order["total"] == 98.0
        assert order["paid_at"] is not None
        # verify GET
        r2 = auth_session.get(f"{API}/orders/{order['order_id']}")
        assert r2.status_code == 200
        assert r2.json()["order_id"] == order["order_id"]

    def test_create_demo_order_over_100_free_shipping(self, auth_session):
        body = {"items": [{"product_id": "p1", "quantity": 1}], "shipping": SAMPLE_SHIPPING}
        r = auth_session.post(f"{API}/orders", json=body)
        assert r.status_code == 200
        order = r.json()
        assert order["subtotal"] == 189.99
        assert order["shipping_fee"] == 0.0
        assert order["total"] == 189.99

    def test_list_orders(self, auth_session):
        r = auth_session.get(f"{API}/orders")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 1

    def test_tracking_paid_order(self, auth_session):
        body = {"items": [{"product_id": "p3", "quantity": 1}], "shipping": SAMPLE_SHIPPING}
        r = auth_session.post(f"{API}/orders", json=body)
        assert r.status_code == 200
        order_id = r.json()["order_id"]
        r2 = auth_session.get(f"{API}/orders/{order_id}/tracking")
        assert r2.status_code == 200, r2.text
        t = r2.json()
        assert t["awaiting_payment"] is False
        assert len(t["stages"]) == 5
        keys = [s["key"] for s in t["stages"]]
        assert keys == ["ordered", "packed", "shipped", "out_for_delivery", "delivered"]
        # First stage 'ordered' should be completed immediately (offset 0)
        assert t["stages"][0]["completed"] is True
        assert isinstance(t["position"], list) and len(t["position"]) == 2
        assert isinstance(t["route"], list) and len(t["route"]) >= 2
        assert 0 <= t["progress"] <= 1


# ------------------------------ Stripe checkout -----------------------
class TestStripe:
    def test_checkout_session_creates(self, auth_session):
        body = {
            "items": [{"product_id": "p1", "quantity": 1}],
            "shipping": SAMPLE_SHIPPING,
            "origin_url": BASE_URL,
        }
        r = auth_session.post(f"{API}/checkout/session", json=body)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "session_id" in data and "order_id" in data
        assert "checkout.stripe.com" in data["url"]
        # Status endpoint should respond (unpaid is expected; won't be 'paid')
        r2 = auth_session.get(f"{API}/checkout/status/{data['session_id']}")
        assert r2.status_code == 200, r2.text
        st = r2.json()
        assert st["payment_status"] != "paid"
        assert st["order_id"] == data["order_id"]

    def test_checkout_requires_auth(self):
        r = requests.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "p1", "quantity": 1}],
            "shipping": SAMPLE_SHIPPING,
            "origin_url": BASE_URL,
        })
        assert r.status_code == 401
