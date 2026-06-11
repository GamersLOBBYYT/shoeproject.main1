from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest,
)

# ---------------------------------------------------------------- DB / app
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("sole")

JWT_ALGORITHM = "HS256"
EMERGENT_SESSION_API = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# ---------------------------------------------------------------- Catalog
COLORWAYS = [
    {"name": "Crimson", "hex": "#ff4757", "filter": "none"},
    {"name": "Emerald", "hex": "#2ed573", "filter": "hue-rotate(135deg) saturate(1.1)"},
    {"name": "Azure", "hex": "#1e90ff", "filter": "hue-rotate(215deg) saturate(1.2)"},
    {"name": "Amber", "hex": "#ffa502", "filter": "hue-rotate(40deg) saturate(1.3)"},
    {"name": "Frost", "hex": "#ffffff", "filter": "grayscale(1) brightness(1.45)"},
]

PRODUCTS_SEED = [
    {"id": "p1", "name": "Air Max Pulse", "brand": "Nike", "price": 189.99, "category": "running",
     "badge": "New", "rating": 5, "card_color": "#ff4757", "image": "/shoes/s1.png", "featured": False},
    {"id": "p2", "name": "Air Force 1 '07", "brand": "Nike", "price": 110.00, "category": "casual",
     "badge": None, "rating": 4, "card_color": "#7c3aed", "image": "/shoes/s2.png", "featured": False},
    {"id": "p3", "name": "Pegasus 41", "brand": "Nike", "price": 160.00, "category": "running",
     "badge": "Hot", "rating": 5, "card_color": "#00c8a0", "image": "/shoes/s3.png", "featured": True},
    {"id": "p4", "name": "Metcon 9", "brand": "Nike", "price": 140.00, "category": "training",
     "badge": None, "rating": 4, "card_color": "#f59e0b", "image": "/shoes/s4.png", "featured": False},
    {"id": "p5", "name": "Cortez", "brand": "Nike", "price": 90.00, "category": "casual",
     "badge": None, "rating": 5, "card_color": "#e11d48", "image": "/shoes/s5.png", "featured": False},
    {"id": "p6", "name": "React Infinity Run", "brand": "Nike", "price": 130.00, "category": "training",
     "badge": "Sale", "rating": 4, "card_color": "#0ea5e9", "image": "/shoes/s6.png", "featured": False},
]

# ---------------------------------------------------------------- Tracking sim
# Warehouse (New York) -> Destination (Boston). Simulated route waypoints.
ROUTE = [
    [40.7128, -74.0060], [40.8591, -73.8000], [41.0534, -73.5387], [41.3083, -72.9279],
    [41.5623, -72.6506], [41.7658, -72.6734], [42.1015, -72.5898], [42.2626, -71.8023],
    [42.3370, -71.5826], [42.3601, -71.0589],
]
TRACK_STAGES = [
    {"key": "ordered", "label": "Order Placed", "offset": 0},
    {"key": "packed", "label": "Packed", "offset": 60},
    {"key": "shipped", "label": "Shipped", "offset": 150},
    {"key": "out_for_delivery", "label": "Out for Delivery", "offset": 320},
    {"key": "delivered", "label": "Delivered", "offset": 450},
]
TRAVEL_START = 150  # shipping begins
TRAVEL_END = 450    # delivered


def interpolate_route(progress: float):
    if progress <= 0:
        return ROUTE[0]
    if progress >= 1:
        return ROUTE[-1]
    segs = len(ROUTE) - 1
    pos = progress * segs
    i = min(int(pos), segs - 1)
    t = pos - i
    a, b = ROUTE[i], ROUTE[i + 1]
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]


# ---------------------------------------------------------------- Auth utils
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(minutes=60)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_jwt_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def public_user(doc: dict) -> dict:
    return {
        "user_id": doc["user_id"],
        "email": doc["email"],
        "name": doc.get("name", ""),
        "picture": doc.get("picture"),
        "role": doc.get("role", "customer"),
        "auth_provider": doc.get("auth_provider", "password"),
    }


async def user_from_session_token(token: str) -> Optional[dict]:
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    return await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})


async def user_from_jwt(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
    except jwt.PyJWTError:
        return None


async def get_current_user(request: Request) -> dict:
    # 1. Google session cookie
    token = request.cookies.get("session_token")
    if token:
        user = await user_from_session_token(token)
        if user:
            user.pop("password_hash", None)
            return user
    # 2. JWT access cookie
    token = request.cookies.get("access_token")
    if token:
        user = await user_from_jwt(token)
        if user:
            user.pop("password_hash", None)
            return user
    # 3. Authorization header (JWT or session token)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        raw = auth_header[7:]
        user = await user_from_jwt(raw) or await user_from_session_token(raw)
        if user:
            user.pop("password_hash", None)
            return user
    raise HTTPException(status_code=401, detail="Not authenticated")


# ---------------------------------------------------------------- Schemas
class RegisterIn(BaseModel):
    name: str = Field(min_length=1)
    email: str
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: str
    password: str


class GoogleSessionIn(BaseModel):
    session_id: str


class OrderItemIn(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=20)
    color: Optional[Dict] = None


class ShippingIn(BaseModel):
    name: str
    phone: str
    address: str
    city: str
    zip_code: Optional[str] = ""


class OrderCreateIn(BaseModel):
    items: List[OrderItemIn]
    shipping: ShippingIn
    card_last4: Optional[str] = None


class CheckoutCreateIn(BaseModel):
    items: List[OrderItemIn]
    shipping: ShippingIn
    origin_url: str


# ---------------------------------------------------------------- Auth routes
LOCKOUT_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


@api_router.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": email,
        "name": body.name.strip(),
        "password_hash": hash_password(body.password),
        "role": "customer",
        "auth_provider": "password",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    set_jwt_cookies(response, create_access_token(user["user_id"], email), create_refresh_token(user["user_id"]))
    return public_user(user)


@api_router.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    now = datetime.now(timezone.utc)
    if attempt and attempt.get("count", 0) >= LOCKOUT_ATTEMPTS:
        last = datetime.fromisoformat(attempt["last_attempt"])
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        if now - last < timedelta(minutes=LOCKOUT_MINUTES):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": now.isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    set_jwt_cookies(response, create_access_token(user["user_id"], email), create_refresh_token(user["user_id"]))
    return public_user(user)


@api_router.post("/auth/google/session")
async def google_session(body: GoogleSessionIn, response: Response):
    async with httpx.AsyncClient(timeout=15) as http:
        resp = await http.get(EMERGENT_SESSION_API, headers={"X-Session-ID": body.session_id})
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = resp.json()
    email = data["email"].strip().lower()

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user:
        await db.users.update_one({"email": email}, {"$set": {"picture": data.get("picture"), "name": data.get("name") or user.get("name")}})
        user["picture"] = data.get("picture")
    else:
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture"),
            "role": "customer",
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(dict(user))

    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("session_token", session_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return public_user(user)


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie("access_token", create_access_token(user["user_id"], user["email"]),
                        httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    return {"ok": True}


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    for key in ("access_token", "refresh_token", "session_token"):
        response.delete_cookie(key, path="/")
    return {"ok": True}


# ---------------------------------------------------------------- Products
@api_router.get("/products")
async def list_products():
    return await db.products.find({}, {"_id": 0}).to_list(100)


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ---------------------------------------------------------------- Orders
FREE_SHIPPING_THRESHOLD = 100.0
SHIPPING_FEE = 8.0


async def build_order(user: dict, items: List[OrderItemIn], shipping: ShippingIn,
                      payment_method: str, status: str) -> dict:
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    order_items = []
    subtotal = 0.0
    for it in items:
        product = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Unknown product: {it.product_id}")
        line_total = round(product["price"] * it.quantity, 2)
        subtotal += line_total
        order_items.append({
            "product_id": product["id"],
            "name": product["name"],
            "price": product["price"],
            "image": product["image"],
            "color": it.color or COLORWAYS[0],
            "quantity": it.quantity,
            "line_total": line_total,
        })
    subtotal = round(subtotal, 2)
    shipping_fee = 0.0 if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_FEE
    total = round(subtotal + shipping_fee, 2)
    order = {
        "order_id": f"SOLE-{uuid.uuid4().hex[:8].upper()}",
        "user_id": user["user_id"],
        "email": user["email"],
        "items": order_items,
        "shipping": shipping.model_dump(),
        "subtotal": subtotal,
        "shipping_fee": shipping_fee,
        "total": total,
        "payment_method": payment_method,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "paid_at": None,
        "stripe_session_id": None,
    }
    await db.orders.insert_one(dict(order))
    return order


@api_router.post("/orders")
async def create_mock_order(body: OrderCreateIn, user: dict = Depends(get_current_user)):
    """Demo payment: order is created and instantly marked paid."""
    order = await build_order(user, body.items, body.shipping, "demo_card", "paid")
    paid_at = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one({"order_id": order["order_id"]}, {"$set": {"paid_at": paid_at}})
    order["paid_at"] = paid_at
    await db.payment_transactions.insert_one({
        "transaction_id": str(uuid.uuid4()),
        "session_id": None,
        "order_id": order["order_id"],
        "user_id": user["user_id"],
        "email": user["email"],
        "amount": order["total"],
        "currency": "usd",
        "payment_method": "demo_card",
        "payment_status": "paid",
        "metadata": {"card_last4": body.card_last4 or "4242"},
        "created_at": paid_at,
    })
    return order


@api_router.get("/orders")
async def list_orders(user: dict = Depends(get_current_user)):
    return await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@api_router.get("/orders/{order_id}/tracking")
async def track_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] != "paid" or not order.get("paid_at"):
        return {
            "order_id": order_id,
            "awaiting_payment": True,
            "status_key": "pending_payment",
            "status_label": "Awaiting Payment",
            "progress": 0,
            "position": ROUTE[0],
            "route": ROUTE,
            "stages": [{**{"key": s["key"], "label": s["label"]}, "completed": False, "time": None} for s in TRACK_STAGES],
            "eta": None,
        }
    paid_at = datetime.fromisoformat(order["paid_at"])
    if paid_at.tzinfo is None:
        paid_at = paid_at.replace(tzinfo=timezone.utc)
    elapsed = (datetime.now(timezone.utc) - paid_at).total_seconds()

    current = TRACK_STAGES[0]
    stages = []
    for s in TRACK_STAGES:
        completed = elapsed >= s["offset"]
        if completed:
            current = s
        stages.append({
            "key": s["key"],
            "label": s["label"],
            "completed": completed,
            "time": (paid_at + timedelta(seconds=s["offset"])).isoformat() if completed else None,
        })
    travel = max(0.0, min(1.0, (elapsed - TRAVEL_START) / (TRAVEL_END - TRAVEL_START)))
    eta = paid_at + timedelta(seconds=TRAVEL_END)
    return {
        "order_id": order_id,
        "awaiting_payment": False,
        "status_key": current["key"],
        "status_label": current["label"],
        "progress": round(travel, 4),
        "position": interpolate_route(travel),
        "route": ROUTE,
        "warehouse": {"label": "SOLE Fulfillment Center — New York", "position": ROUTE[0]},
        "destination": {"label": f"Delivery — {order['shipping']['city']}", "position": ROUTE[-1]},
        "stages": stages,
        "eta": eta.isoformat(),
        "delivered": elapsed >= TRAVEL_END,
    }


# ---------------------------------------------------------------- Stripe checkout
def make_stripe(request: Request) -> StripeCheckout:
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    return StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)


@api_router.post("/checkout/session")
async def create_checkout_session(body: CheckoutCreateIn, request: Request, user: dict = Depends(get_current_user)):
    order = await build_order(user, body.items, body.shipping, "stripe", "pending_payment")
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/order-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/checkout"
    stripe_checkout = make_stripe(request)
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(
        amount=float(order["total"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_id": order["order_id"], "user_id": user["user_id"], "email": user["email"]},
    ))
    await db.orders.update_one({"order_id": order["order_id"]}, {"$set": {"stripe_session_id": session.session_id}})
    await db.payment_transactions.insert_one({
        "transaction_id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "order_id": order["order_id"],
        "user_id": user["user_id"],
        "email": user["email"],
        "amount": order["total"],
        "currency": "usd",
        "payment_method": "stripe",
        "payment_status": "initiated",
        "metadata": {"order_id": order["order_id"]},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id, "order_id": order["order_id"]}


async def mark_session_paid(session_id: str):
    """Idempotent: marks transaction + order as paid only once."""
    result = await db.payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
    )
    if result.modified_count > 0:
        tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        await db.orders.update_one(
            {"order_id": tx["order_id"], "status": {"$ne": "paid"}},
            {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
        )


@api_router.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    tx = await db.payment_transactions.find_one({"session_id": session_id, "user_id": user["user_id"]}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Payment session not found")
    stripe_checkout = make_stripe(request)
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    if status.payment_status == "paid":
        await mark_session_paid(session_id)
    elif status.status == "expired":
        await db.payment_transactions.update_one(
            {"session_id": session_id, "payment_status": {"$ne": "paid"}},
            {"$set": {"payment_status": "expired"}},
        )
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "order_id": tx["order_id"],
    }


@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    stripe_checkout = make_stripe(request)
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, request.headers.get("Stripe-Signature"))
        if webhook_response.payment_status == "paid" and webhook_response.session_id:
            await mark_session_paid(webhook_response.session_id)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook error")


# ---------------------------------------------------------------- Startup
async def seed_user(email: str, password: str, name: str, role: str):
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": name,
            "password_hash": hash_password(password),
            "role": role,
            "auth_provider": "password",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(password, existing.get("password_hash") or ""):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id")
    await db.user_sessions.create_index("session_token")
    await db.login_attempts.create_index("identifier")
    await db.orders.create_index("user_id")
    await db.orders.create_index("order_id")
    await db.payment_transactions.create_index("session_id")
    for p in PRODUCTS_SEED:
        await db.products.update_one({"id": p["id"]}, {"$set": {**p, "colors": COLORWAYS}}, upsert=True)
    await seed_user(os.environ["ADMIN_EMAIL"], os.environ["ADMIN_PASSWORD"], "Admin", "admin")
    await seed_user(os.environ["TEST_USER_EMAIL"], os.environ["TEST_USER_PASSWORD"], "John Doe", "customer")
    logger.info("Startup complete: products + users seeded")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=r"https?://.*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
