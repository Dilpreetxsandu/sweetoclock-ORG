from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

import asyncio
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import bcrypt
import httpx
import jwt
import razorpay
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import FileResponse
from fpdf import FPDF
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RAZORPAY_MOCK = (not RAZORPAY_KEY_ID) or ("CHANGE_ME" in RAZORPAY_KEY_ID)
rzp_client = None if RAZORPAY_MOCK else razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.environ.get("TWILIO_WHATSAPP_FROM", "")
TWILIO_MOCK = (not TWILIO_SID) or ("CHANGE_ME" in TWILIO_SID)

SHIPROCKET_EMAIL = os.environ.get("SHIPROCKET_EMAIL", "")
SHIPROCKET_PASSWORD = os.environ.get("SHIPROCKET_PASSWORD", "")
SHIPROCKET_PICKUP = os.environ.get("SHIPROCKET_PICKUP_LOCATION", "Primary")
SHIPROCKET_MOCK = (not SHIPROCKET_EMAIL) or ("CHANGE_ME" in SHIPROCKET_EMAIL)
SR_BASE = "https://apiv2.shiprocket.in/v1/external"

INVOICE_DIR = Path(__file__).parent / "invoices"
INVOICE_DIR.mkdir(exist_ok=True)

ORDER_STATUSES = ["created", "paid", "packed", "shipped", "delivered"]
FREE_DELIVERY_OVER = 799.0
DELIVERY_FEE = 79.0

GEN = "https://static.prod-images.emergentagent.com/jobs/7e3f0152-49d7-49d6-9fea-0836246843ac/images/"

SEED_PRODUCTS = [
    {
        "slug": "laddoo", "name": "Laddoo",
        "tagline": "Slow-roasted gram flour folded into pure desi ghee, crowned with almond.",
        "category": "Ladoo", "price": 599, "compare_at": None, "unit": "1kg",
        "rating": 4.9, "reviews": 212, "badge": "Best Seller",
        "image": "/products/laddo-1.jpg",
        "gallery": ["/products/laddo-1.jpg", "/products/laddo-2.jpg", "/products/laddo-3.jpg", "/products/laddo-4.jpg", "/products/laddo-5.jpg"],
        "about": [
            "Our Laddoo begins with coarse gram flour roasted low and slow in A2 bilona ghee until the whole kitchen smells of toasted nuts — the step nobody rushes in this house.",
            "Each one is hand-rolled while still warm, finished with a single almond pressed on top. Soft-centred, fragrant, and gone far too quickly.",
        ],
        "ingredients": ["Gram Flour", "A2 Bilona Ghee", "Almond", "Green Cardamom", "Cane Sugar"],
    },
    {
        "slug": "khajur-fudge", "name": "Khajur Fudge",
        "tagline": "Dates crushed with pistachio and cashew — zero refined sugar.",
        "category": "Signature", "price": 899, "compare_at": None, "unit": "1kg",
        "rating": 4.9, "reviews": 148, "badge": "Sugar Free",
        "image": "/products/khajur-1.jpg",
        "gallery": ["/products/khajur-1.jpg", "/products/khajur-2.jpg", "/products/khajur-3.jpg", "/products/khajur-4.jpg"],
        "about": [
            "Plump dates are stone-ground into a rich paste and folded through roasted pistachios, cashews and almonds — bound with nothing but a touch of A2 ghee.",
            "Pressed, rested and sliced into discs. Dense, dark and naturally sweet. No added sugar, no syrup, no shortcuts — the one we reach for ourselves.",
        ],
        "ingredients": ["Dates", "Pistachio", "Cashew", "Almond", "A2 Ghee"],
    },
]


# ---------- Models ----------

class Customer(BaseModel):
    name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    email: Optional[str] = None


class CartItem(BaseModel):
    product_id: str
    qty: int = 1


class CreateOrderRequest(BaseModel):
    customer: Customer
    items: List[CartItem]


class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ProductIn(BaseModel):
    name: str
    slug: str = ""
    tagline: str = ""
    category: str = "Signature"
    price: float
    compare_at: Optional[float] = None
    unit: str = "500g"
    rating: float = 4.8
    reviews: int = 0
    badge: Optional[str] = None
    image: str = ""
    gallery: List[str] = []
    about: List[str] = []
    ingredients: List[str] = []
    active: bool = True


class StatusUpdate(BaseModel):
    status: str


# ---------- Helpers ----------

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_order_number() -> str:
    return "SOC-" + uuid.uuid4().hex[:6].upper()


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(email: str) -> str:
    payload = {"sub": email, "role": "admin", "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return {"email": payload["sub"]}


def public_order(order: dict) -> dict:
    order = dict(order)
    order.pop("_id", None)
    return order


# ---------- Invoice ----------

def generate_invoice_pdf(order: dict) -> Path:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 22)
    pdf.cell(0, 12, "Sweet'O Clock", ln=True)
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 6, "Handcrafted Indian Mithai - Nagpur, Maharashtra 440001", ln=True)
    pdf.ln(6)
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 8, f"Invoice - {order['order_number']}", ln=True)
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 6, f"Date: {order['created_at'][:10]}", ln=True)
    c = order["customer"]
    pdf.cell(0, 6, f"Billed to: {c['name']}  |  Phone: {c['phone']}", ln=True)
    pdf.multi_cell(0, 6, f"Deliver to: {c['address']}, {c['city']}, {c['state']} - {c['pincode']}")
    pdf.ln(4)
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(90, 8, "Item", border=1)
    pdf.cell(20, 8, "Qty", border=1)
    pdf.cell(40, 8, "Rate", border=1)
    pdf.cell(40, 8, "Amount", border=1, ln=True)
    pdf.set_font("helvetica", "", 10)
    for it in order["items"]:
        pdf.cell(90, 8, f"{it['name'][:36]} ({it.get('unit', '')})", border=1)
        pdf.cell(20, 8, str(it["qty"]), border=1)
        pdf.cell(40, 8, f"Rs. {it['price']:.0f}", border=1)
        pdf.cell(40, 8, f"Rs. {it['line_total']:.2f}", border=1, ln=True)
    pdf.cell(150, 8, "Subtotal", border=1)
    pdf.cell(40, 8, f"Rs. {order['subtotal']:.2f}", border=1, ln=True)
    pdf.cell(150, 8, "Delivery", border=1)
    pdf.cell(40, 8, "Free" if order["delivery_fee"] == 0 else f"Rs. {order['delivery_fee']:.2f}", border=1, ln=True)
    pdf.set_font("helvetica", "B", 11)
    pdf.cell(150, 8, "Total", border=1)
    pdf.cell(40, 8, f"Rs. {order['total']:.2f}", border=1, ln=True)
    pdf.ln(6)
    pdf.set_font("helvetica", "I", 9)
    pay = order.get("payment") or {}
    pdf.cell(0, 6, f"Payment: Prepaid via Razorpay  {pay.get('razorpay_payment_id', '')}", ln=True)
    pdf.cell(0, 6, "Thank you for ordering with Sweet'O Clock!", ln=True)
    path = INVOICE_DIR / f"{order['order_number']}.pdf"
    pdf.output(str(path))
    return path


# ---------- WhatsApp (Twilio) ----------

async def send_invoice_whatsapp(order: dict, invoice_url: str) -> str:
    if TWILIO_MOCK:
        logger.info("Twilio not configured - using PDF invoice fallback")
        return "pdf_fallback"
    try:
        from twilio.rest import Client as TwilioClient

        tc = TwilioClient(TWILIO_SID, TWILIO_TOKEN)
        to = order["customer"]["phone"].strip()
        if not to.startswith("+"):
            to = "+91" + to.lstrip("0")
        body = (
            f"Sweet'O Clock order {order['order_number']} confirmed! "
            f"Total Rs. {order['total']:.2f}. Download your invoice: {invoice_url}"
        )
        tc.messages.create(from_=f"whatsapp:{TWILIO_FROM}", to=f"whatsapp:{to}", body=body)
        return "whatsapp"
    except Exception as e:
        logger.warning(f"WhatsApp send failed, PDF fallback: {e}")
        return "pdf_fallback"


# ---------- Shiprocket ----------

class SRTokenCache:
    def __init__(self):
        self.token: Optional[str] = None
        self.expires_at = datetime.min.replace(tzinfo=timezone.utc)
        self.lock = asyncio.Lock()

    async def get(self, http: httpx.AsyncClient) -> str:
        now = datetime.now(timezone.utc)
        if self.token and now < self.expires_at - timedelta(minutes=5):
            return self.token
        async with self.lock:
            now = datetime.now(timezone.utc)
            if self.token and now < self.expires_at - timedelta(minutes=5):
                return self.token
            resp = await http.post(f"{SR_BASE}/auth/login", json={"email": SHIPROCKET_EMAIL, "password": SHIPROCKET_PASSWORD})
            if resp.status_code != 200:
                raise HTTPException(502, "Shiprocket authentication failed")
            token = resp.json().get("token")
            if not token:
                raise HTTPException(502, "Shiprocket returned no token")
            self.token = token
            self.expires_at = now + timedelta(hours=239)
            return token

    def invalidate(self):
        self.token = None
        self.expires_at = datetime.min.replace(tzinfo=timezone.utc)


sr_cache = SRTokenCache()


async def sr_request(method: str, path: str, **kwargs) -> dict:
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=5.0)) as http:
        token = await sr_cache.get(http)
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        resp = await http.request(method, f"{SR_BASE}{path}", headers=headers, **kwargs)
        if resp.status_code == 401:
            sr_cache.invalidate()
            token = await sr_cache.get(http)
            headers["Authorization"] = f"Bearer {token}"
            resp = await http.request(method, f"{SR_BASE}{path}", headers=headers, **kwargs)
        if resp.status_code >= 400:
            raise HTTPException(502, f"Shiprocket error ({resp.status_code}): {resp.text[:500]}")
        return resp.json()


# ---------- Public: Products ----------

@api_router.get("/products")
async def list_products():
    return await db.products.find({"active": True}, {"_id": 0}).to_list(100)


# ---------- Public: Orders / Payment ----------

@api_router.post("/orders/create")
async def create_order(req: CreateOrderRequest):
    if not req.items:
        raise HTTPException(400, "Cart is empty")
    items = []
    subtotal = 0.0
    for ci in req.items:
        product = await db.products.find_one({"id": ci.product_id, "active": True}, {"_id": 0})
        if not product:
            raise HTTPException(400, f"Product not found: {ci.product_id}")
        if ci.qty < 1 or ci.qty > 50:
            raise HTTPException(400, "Invalid quantity")
        line_total = round(product["price"] * ci.qty, 2)
        subtotal += line_total
        items.append({
            "product_id": product["id"],
            "name": product["name"],
            "price": product["price"],
            "unit": product.get("unit", ""),
            "qty": ci.qty,
            "line_total": line_total,
        })
    subtotal = round(subtotal, 2)
    delivery_fee = 0.0 if subtotal >= FREE_DELIVERY_OVER else DELIVERY_FEE
    total = round(subtotal + delivery_fee, 2)
    order_id = str(uuid.uuid4())
    order_number = gen_order_number()

    if RAZORPAY_MOCK:
        razorpay_order_id = "order_mock_" + uuid.uuid4().hex[:14]
    else:
        try:
            rzp_order = rzp_client.order.create({
                "amount": int(total * 100),
                "currency": "INR",
                "payment_capture": 1,
                "receipt": order_number[:40],
            })
            razorpay_order_id = rzp_order["id"]
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            raise HTTPException(502, "Payment gateway error. Please try again.")

    order = {
        "id": order_id,
        "order_number": order_number,
        "customer": req.customer.model_dump(),
        "items": items,
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "total": total,
        "status": "created",
        "payment": {"razorpay_order_id": razorpay_order_id, "mock": RAZORPAY_MOCK},
        "shipment": None,
        "invoice_channel": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.orders.insert_one(order)
    return {
        "order_id": order_id,
        "order_number": order_number,
        "amount": int(total * 100),
        "total": total,
        "currency": "INR",
        "razorpay_order_id": razorpay_order_id,
        "razorpay_key_id": None if RAZORPAY_MOCK else RAZORPAY_KEY_ID,
        "mock": RAZORPAY_MOCK,
    }


@api_router.post("/orders/verify")
async def verify_payment(req: VerifyPaymentRequest, request: Request):
    order = await db.orders.find_one({"id": req.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    if order["status"] != "created":
        return public_order(order)
    if req.razorpay_order_id != order["payment"]["razorpay_order_id"]:
        raise HTTPException(400, "Payment verification failed")

    if RAZORPAY_MOCK:
        if req.razorpay_signature != "mock_signature":
            raise HTTPException(400, "Payment verification failed")
    else:
        try:
            rzp_client.utility.verify_payment_signature({
                "razorpay_order_id": req.razorpay_order_id,
                "razorpay_payment_id": req.razorpay_payment_id,
                "razorpay_signature": req.razorpay_signature,
            })
        except Exception:
            raise HTTPException(400, "Payment verification failed")

    order["payment"].update({
        "razorpay_payment_id": req.razorpay_payment_id,
        "razorpay_signature": req.razorpay_signature,
    })
    order["status"] = "paid"
    order["updated_at"] = now_iso()

    generate_invoice_pdf(order)
    base = str(request.base_url).rstrip("/")
    invoice_url = f"{base}/api/orders/{order['id']}/invoice"
    channel = await send_invoice_whatsapp(order, invoice_url)
    order["invoice_channel"] = channel

    await db.orders.update_one({"id": order["id"]}, {"$set": {
        "status": order["status"],
        "payment": order["payment"],
        "invoice_channel": channel,
        "updated_at": order["updated_at"],
    }})
    return public_order(order)


@api_router.get("/orders/track")
async def track_order(order_number: str = Query(...), phone: str = Query(...)):
    order = await db.orders.find_one(
        {"order_number": order_number.strip().upper(), "customer.phone": phone.strip()}, {"_id": 0}
    )
    if not order:
        raise HTTPException(404, "Order not found. Check your order ID and phone number.")
    shipment = order.get("shipment")
    if shipment and shipment.get("awb") and not shipment.get("mock"):
        try:
            result = await sr_request("GET", f"/courier/track/awb/{shipment['awb']}")
            track_data = (result.get("tracking_data") or {})
            current = (track_data.get("shipment_track") or [{}])[0].get("current_status")
            if current:
                shipment["last_status"] = current
                order["shipment"] = shipment
                await db.orders.update_one({"id": order["id"]}, {"$set": {"shipment": shipment}})
        except Exception as e:
            logger.warning(f"Shiprocket tracking refresh failed: {e}")
    return public_order(order)


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    return public_order(order)


@api_router.get("/orders/{order_id}/invoice")
async def download_invoice(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    path = INVOICE_DIR / f"{order['order_number']}.pdf"
    if not path.exists():
        generate_invoice_pdf(order)
    return FileResponse(str(path), media_type="application/pdf", filename=f"SweetOClock-{order['order_number']}.pdf")


# ---------- Auth ----------

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    email = req.email.strip().lower()
    admin = await db.admins.find_one({"email": email})
    if not admin or not verify_password(req.password, admin["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_access_token(email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    return {"email": email, "role": "admin", "token": token}


@api_router.get("/auth/me")
async def auth_me(admin: dict = Depends(get_admin)):
    return admin


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


# ---------- Admin: Products ----------

@api_router.get("/admin/products")
async def admin_list_products(admin: dict = Depends(get_admin)):
    return await db.products.find({}, {"_id": 0}).to_list(200)


@api_router.post("/admin/products")
async def admin_create_product(p: ProductIn, admin: dict = Depends(get_admin)):
    doc = p.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["slug"] = doc["slug"] or slugify(doc["name"])
    if not doc["gallery"] and doc["image"]:
        doc["gallery"] = [doc["image"]]
    doc["created_at"] = now_iso()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, p: ProductIn, admin: dict = Depends(get_admin)):
    doc = p.model_dump()
    doc["slug"] = doc["slug"] or slugify(doc["name"])
    result = await db.products.update_one({"id": product_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(404, "Product not found")
    return await db.products.find_one({"id": product_id}, {"_id": 0})


@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin: dict = Depends(get_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Product not found")
    return {"ok": True}


# ---------- Admin: Orders ----------

@api_router.get("/admin/orders")
async def admin_list_orders(admin: dict = Depends(get_admin)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.patch("/admin/orders/{order_id}/status")
async def admin_update_status(order_id: str, req: StatusUpdate, admin: dict = Depends(get_admin)):
    if req.status not in ORDER_STATUSES:
        raise HTTPException(400, "Invalid status")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": req.status, "updated_at": now_iso()}})
    if result.matched_count == 0:
        raise HTTPException(404, "Order not found")
    return await db.orders.find_one({"id": order_id}, {"_id": 0})


@api_router.post("/admin/orders/{order_id}/shiprocket")
async def admin_push_shiprocket(order_id: str, admin: dict = Depends(get_admin)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    if order["status"] == "created":
        raise HTTPException(400, "Order is not paid yet")
    if order.get("shipment") and order["shipment"].get("awb"):
        return order["shipment"]

    total_weight = max(sum(i["qty"] for i in order["items"]) * 0.5, 0.5)

    if SHIPROCKET_MOCK:
        shipment = {
            "shiprocket_order_id": None,
            "shipment_id": None,
            "awb": "MOCK" + uuid.uuid4().hex[:10].upper(),
            "courier": "Mock Courier Express",
            "mock": True,
            "last_status": "AWB Assigned",
            "created_at": now_iso(),
        }
    else:
        c = order["customer"]
        payload = {
            "order_id": order["order_number"],
            "order_date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            "pickup_location": SHIPROCKET_PICKUP,
            "billing_customer_name": c["name"],
            "billing_address": c["address"],
            "billing_city": c["city"],
            "billing_pincode": c["pincode"],
            "billing_state": c["state"],
            "billing_country": "India",
            "billing_email": c.get("email") or "orders@sweetoclock.in",
            "billing_phone": c["phone"].lstrip("+91").lstrip("0")[-10:],
            "shipping_is_billing": True,
            "payment_method": "Prepaid",
            "sub_total": order["total"],
            "length": 20, "breadth": 15, "height": 10,
            "weight": total_weight,
            "order_items": [
                {"name": i["name"], "sku": i["product_id"][:12], "units": i["qty"], "selling_price": i["price"]}
                for i in order["items"]
            ],
        }
        created = await sr_request("POST", "/orders/create/adhoc", json=payload)
        shipment_id = created.get("shipment_id")
        if not shipment_id:
            raise HTTPException(502, "Shiprocket returned no shipment_id")
        awb_result = await sr_request("POST", "/courier/assign/awb", json={"shipment_id": shipment_id})
        awb_data = (awb_result.get("response") or {}).get("data") or awb_result.get("data") or {}
        shipment = {
            "shiprocket_order_id": created.get("order_id"),
            "shipment_id": shipment_id,
            "awb": awb_data.get("awb_code"),
            "courier": awb_data.get("courier_name"),
            "mock": False,
            "last_status": "AWB Assigned",
            "created_at": now_iso(),
        }

    await db.orders.update_one({"id": order_id}, {"$set": {"shipment": shipment, "status": "shipped", "updated_at": now_iso()}})
    return shipment


@api_router.post("/admin/orders/{order_id}/resend-invoice")
async def admin_resend_invoice(order_id: str, request: Request, admin: dict = Depends(get_admin)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    generate_invoice_pdf(order)
    base = str(request.base_url).rstrip("/")
    invoice_url = f"{base}/api/orders/{order['id']}/invoice"
    channel = await send_invoice_whatsapp(order, invoice_url)
    await db.orders.update_one({"id": order_id}, {"$set": {"invoice_channel": channel}})
    return {"channel": channel, "invoice_url": invoice_url}


@api_router.get("/")
async def root():
    return {"message": "Sweet'O Clock API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)
    existing = await db.admins.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.admins.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info(f"Admin seeded: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.admins.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
    for sp in SEED_PRODUCTS:
        found = await db.products.find_one({"slug": sp["slug"]})
        if not found:
            doc = dict(sp)
            doc.update({"id": str(uuid.uuid4()), "active": True, "created_at": now_iso()})
            await db.products.insert_one(doc)
            logger.info(f"Product seeded: {sp['name']}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
