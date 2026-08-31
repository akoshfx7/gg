"""
Web App uchun minimal backend.

Bu server admin panel login/parolni ENDI FRONTEND'DA EMAS, shu yerda -
Railway'ning maxfiy Environment Variables'ida saqlangan qiymatlar bilan
solishtiradi. Muvaffaqiyatli kirishda vaqtinchalik amal qiladigan,
serverda imzolangan token qaytariladi; webapp shu tokenni admin panel
ochiq turgan davomida ishlatadi.

Qo'shimcha himoya:
- Har bir IP uchun ketma-ket noto'g'ri urinishlar cheklangan (brute-force'ga qarshi)
- Login/parol hech qachon javobda yoki logda qaytarilmaydi
- Token vaqt bo'yicha eskiradi (default: 12 soat)
"""

import hashlib
import hmac
import json
import time
from typing import Optional
from urllib.parse import parse_qsl

from aiohttp import web

import config

TOKEN_TTL_SECONDS = 12 * 60 * 60  # 12 soat
USER_TOKEN_TTL_SECONDS = 24 * 60 * 60  # 24 soat
MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60  # 15 daqiqa
# Shu davr ichida heartbeat kelmasa, admin Web App'dan chiqqan deb hisoblanadi.
PRESENCE_TIMEOUT_SECONDS = 45

DEFAULT_PRICING = {
    "stars_price_per_unit": "0.015",
    "premium_price_3": "9.99",
    "premium_price_6": "16.99",
    "premium_price_12": "29.99",
    "card_number": "8600 0000 0000 0000",
}

# IP -> (fail_count, first_fail_ts)
_failed_attempts: dict[str, tuple[int, float]] = {}
# Admin Web App'da faol turgan paytda oxirgi "men shu yerdaman" signali qachon kelgani
_admin_last_seen: Optional[float] = None


def admin_is_present() -> bool:
    if _admin_last_seen is None:
        return False
    return (time.time() - _admin_last_seen) < PRESENCE_TIMEOUT_SECONDS


def mark_admin_present() -> None:
    global _admin_last_seen
    _admin_last_seen = time.time()


def mark_admin_left() -> None:
    global _admin_last_seen
    _admin_last_seen = None


def _client_ip(request: web.Request) -> str:
    return request.headers.get("X-Forwarded-For", request.remote or "unknown").split(",")[0].strip()


def _is_locked_out(ip: str) -> bool:
    entry = _failed_attempts.get(ip)
    if not entry:
        return False
    count, first_ts = entry
    if count < MAX_ATTEMPTS:
        return False
    if time.time() - first_ts > LOCKOUT_SECONDS:
        _failed_attempts.pop(ip, None)
        return False
    return True


def _register_failure(ip: str) -> None:
    count, first_ts = _failed_attempts.get(ip, (0, time.time()))
    if time.time() - first_ts > LOCKOUT_SECONDS:
        count, first_ts = 0, time.time()
    _failed_attempts[ip] = (count + 1, first_ts)


def _clear_failures(ip: str) -> None:
    _failed_attempts.pop(ip, None)


def _make_token(login: str) -> str:
    expires_at = int(time.time()) + TOKEN_TTL_SECONDS
    payload = f"{login}:{expires_at}"
    sig = hmac.new(config.ADMIN_PANEL_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"


def _verify_token(token: str) -> bool:
    try:
        login, expires_at, sig = token.split(":")
    except ValueError:
        return False
    payload = f"{login}:{expires_at}"
    expected_sig = hmac.new(config.ADMIN_PANEL_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected_sig):
        return False
    return int(expires_at) >= int(time.time())


# ---------------- Telegram Web App foydalanuvchi autentifikatsiyasi ----------------
# Bu yerda maqsad: Web App'ni ochgan kishi HAQIQATAN HAM shu Telegram akkaunt
# egasi ekanligini tasdiqlash (Telegram'ning o'z HMAC formulasi orqali), so'ng
# unga faqat O'Z balansi/buyurtmalarini boshqarishga ruxsat beruvchi token berish.
# Shu tufayli hech kim boshqa birovning balansini o'g'irlab yoki soxta buyurtma
# yarata olmaydi.
def _verify_telegram_init_data(init_data: str) -> Optional[dict]:
    if not init_data:
        return None
    try:
        pairs = dict(parse_qsl(init_data, strict_parsing=True))
    except ValueError:
        return None

    received_hash = pairs.pop("hash", None)
    if not received_hash:
        return None

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
    secret_key = hmac.new(b"WebAppData", config.BOT_TOKEN.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        return None

    # 24 soatdan eski initData'ni rad etamiz (replay hujumidan himoya)
    auth_date = pairs.get("auth_date")
    if auth_date and (time.time() - int(auth_date)) > 24 * 60 * 60:
        return None

    result = dict(pairs)
    if "user" in result:
        try:
            result["user"] = json.loads(result["user"])
        except (json.JSONDecodeError, TypeError):
            result["user"] = None
    return result


def _make_user_token(telegram_id: int) -> str:
    expires_at = int(time.time()) + USER_TOKEN_TTL_SECONDS
    payload = f"{telegram_id}:{expires_at}"
    sig = hmac.new(config.ADMIN_PANEL_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"


def _verify_user_token(token: str) -> Optional[int]:
    try:
        telegram_id, expires_at, sig = token.split(":")
    except ValueError:
        return None
    payload = f"{telegram_id}:{expires_at}"
    expected_sig = hmac.new(config.ADMIN_PANEL_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected_sig):
        return None
    if int(expires_at) < int(time.time()):
        return None
    return int(telegram_id)


def _require_user(request: web.Request) -> Optional[int]:
    auth = request.headers.get("Authorization", "")
    token = auth[len("Bearer "):] if auth.startswith("Bearer ") else ""
    return _verify_user_token(token) if token else None


@web.middleware
async def cors_middleware(request: web.Request, handler):
    origin = request.headers.get("Origin", "")
    allowed_origin = config.WEBAPP_ORIGIN if config.WEBAPP_ORIGIN else origin

    if request.method == "OPTIONS":
        resp = web.Response()
    else:
        try:
            resp = await handler(request)
        except web.HTTPException as exc:
            resp = exc

    resp.headers["Access-Control-Allow-Origin"] = allowed_origin or "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Vary"] = "Origin"
    return resp


async def health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})


async def admin_login(request: web.Request) -> web.Response:
    ip = _client_ip(request)

    if _is_locked_out(ip):
        return web.json_response(
            {"ok": False, "error": "Juda ko'p noto'g'ri urinish. Birozdan so'ng qayta urinib ko'ring."},
            status=429,
        )

    try:
        data = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)

    login = str(data.get("login", ""))
    password = str(data.get("password", ""))

    db = request.app["db"]
    if not await db.verify_admin(login, password):
        _register_failure(ip)
        return web.json_response({"ok": False, "error": "Login yoki parol noto'g'ri"}, status=401)

    _clear_failures(ip)
    token = _make_token(login)
    return web.json_response({"ok": True, "token": token, "expires_in": TOKEN_TTL_SECONDS})


def _admin_login_from_request(request: web.Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[len("Bearer "):] if auth_header.startswith("Bearer ") else ""
    if not token or not _verify_token(token):
        return None
    return token.split(":")[0]


async def submit_payment(request: web.Request) -> web.Response:
    """Foydalanuvchi 'Pul kiritish' bo'limida chek yuborganda chaqiriladi.
    Endi bu so'rov ADMIN PANELDA HAM ko'rinadi - avval faqat foydalanuvchining
    o'z brauzerida qolib ketardi."""
    telegram_id = _require_user(request)
    if telegram_id is None:
        return web.json_response({"ok": False, "error": "Avtorizatsiyadan o'ting"}, status=401)

    try:
        data = await request.json()
        amount_usd = float(data.get("amountUsd", 0))
        receipt_data = str(data.get("receiptDataUrl", ""))
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)

    if amount_usd <= 0:
        return web.json_response({"ok": False, "error": "Summa noto'g'ri"}, status=400)

    db = request.app["db"]
    buyer = await db.get_user(telegram_id)
    if not buyer:
        return web.json_response({"ok": False, "error": "Foydalanuvchi topilmadi"}, status=404)
    if buyer.get("blocked"):
        return web.json_response({"ok": False, "error": "Hisobingiz bloklangan"}, status=403)

    req_id = f"PAY-{int(time.time() * 1000) % 10_000_000}"
    await db.add_payment_request(req_id, telegram_id, amount_usd, receipt_data)

    if not admin_is_present():
        bot = request.app.get("bot")
        if bot is not None:
            text = f"\U0001F4B3 <b>Yangi to'lov so'rovi!</b>\n\n№ {req_id}\nSumma: {amount_usd}$"
            for admin_id in config.ADMIN_IDS:
                try:
                    await bot.send_message(admin_id, text)
                except Exception:
                    pass

    return web.json_response({"ok": True, "requestId": req_id})


async def admin_list_payments(request: web.Request) -> web.Response:
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    db = request.app["db"]
    reqs = await db.list_payment_requests()
    users_by_id = {u["user_id"]: u for u in await db.list_users()}
    result = []
    for p in reqs:
        buyer = users_by_id.get(p.get("user_id"))
        result.append({
            "id": p["id"], "buyerId": p.get("user_id"),
            "buyerUsername": (f"@{buyer['username']}" if buyer and buyer.get("username") else "?"),
            "amountUsd": round(float(p.get("amount_usd") or 0), 2),
            "receiptDataUrl": p.get("receipt_data"),
            "status": p["status"], "createdAt": p["created_at"],
        })
    return web.json_response({"ok": True, "requests": result})


async def admin_payment_action(request: web.Request) -> web.Response:
    """POST /api/admin/payments/{id}/approve | reject | block"""
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)

    req_id = request.match_info["req_id"]
    action = request.match_info["action"]
    db = request.app["db"]
    payment = await db.get_payment_request(req_id)
    if not payment:
        return web.json_response({"ok": False, "error": "So'rov topilmadi"}, status=404)
    if payment["status"] != "Kutilmoqda":
        return web.json_response({"ok": False, "error": "Bu so'rov allaqachon yakunlangan"}, status=400)

    bot = request.app.get("bot")
    buyer_id = payment.get("user_id")

    if action == "approve":
        await db.set_payment_status(req_id, "Bajarildi")
        new_balance = await db.adjust_balance(buyer_id, float(payment.get("amount_usd") or 0)) if buyer_id else None
        if bot is not None and buyer_id:
            try:
                await bot.send_message(
                    buyer_id,
                    f"\u2705 To'lovingiz tasdiqlandi! Balansingiz {payment['amount_usd']}$ ga oshirildi.",
                )
            except Exception:
                pass
        return web.json_response({"ok": True, "newBalance": new_balance})

    elif action == "reject":
        await db.set_payment_status(req_id, "Bekor qilindi")
        if bot is not None and buyer_id:
            try:
                await bot.send_message(buyer_id, f"\u274C To'lov so'rovingiz ({req_id}) rad etildi. Chek noto'g'ri bo'lishi mumkin.")
            except Exception:
                pass
        return web.json_response({"ok": True})

    elif action == "block":
        await db.set_payment_status(req_id, "Bekor qilindi")
        if buyer_id:
            await db.set_blocked(buyer_id, True)
        if bot is not None and buyer_id:
            try:
                await bot.send_message(buyer_id, "\u26D4 Hisobingiz shubhali chek yuborgani uchun bloklandi.")
            except Exception:
                pass
        return web.json_response({"ok": True})

    return web.json_response({"ok": False, "error": "Noma'lum amal"}, status=400)


async def admin_list_admins(request: web.Request) -> web.Response:
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    db = request.app["db"]
    return web.json_response({"ok": True, "admins": await db.list_admins()})


async def admin_add_admin(request: web.Request) -> web.Response:
    login = _admin_login_from_request(request)
    if not login:
        return web.json_response({"ok": False}, status=401)
    db = request.app["db"]
    admins = {a["login"]: a for a in await db.list_admins()}
    if not admins.get(login, {}).get("is_owner"):
        return web.json_response({"ok": False, "error": "Faqat bosh admin yangi admin qo'sha oladi"}, status=403)

    try:
        data = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)

    new_login = str(data.get("login", "")).strip()
    new_password = str(data.get("password", "")).strip()
    if not new_login or len(new_password) < 4:
        return web.json_response({"ok": False, "error": "Login va parol (kamida 4 belgi) kerak"}, status=400)

    ok = await db.add_admin(new_login, new_password)
    if not ok:
        return web.json_response({"ok": False, "error": "Bu login band"}, status=409)
    return web.json_response({"ok": True})


async def admin_remove_admin(request: web.Request) -> web.Response:
    login = _admin_login_from_request(request)
    if not login:
        return web.json_response({"ok": False}, status=401)
    db = request.app["db"]
    admins = {a["login"]: a for a in await db.list_admins()}
    if not admins.get(login, {}).get("is_owner"):
        return web.json_response({"ok": False, "error": "Faqat bosh admin adminni o'chira oladi"}, status=403)

    target_login = request.match_info["target_login"]
    ok = await db.remove_admin(target_login)
    if not ok:
        return web.json_response({"ok": False, "error": "Bu adminni o'chirib bo'lmaydi"}, status=400)
    return web.json_response({"ok": True})


async def admin_update_password(request: web.Request) -> web.Response:
    login = _admin_login_from_request(request)
    if not login:
        return web.json_response({"ok": False}, status=401)
    db = request.app["db"]
    admins = {a["login"]: a for a in await db.list_admins()}
    is_owner = admins.get(login, {}).get("is_owner")

    try:
        data = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)

    target_login = request.match_info["target_login"]
    new_password = str(data.get("password", "")).strip()
    if len(new_password) < 4:
        return web.json_response({"ok": False, "error": "Parol kamida 4 belgidan iborat bo'lsin"}, status=400)

    # Admin faqat o'zining parolini, bosh admin esa hammaning parolini o'zgartira oladi.
    if not is_owner and target_login != login:
        return web.json_response({"ok": False, "error": "Ruxsat yo'q"}, status=403)

    ok = await db.update_admin_password(target_login, new_password)
    if not ok:
        return web.json_response({"ok": False, "error": "Admin topilmadi"}, status=404)
    return web.json_response({"ok": True})


def _user_public(u: dict) -> dict:
    return {
        "id": str(u["user_id"]),
        "telegramId": u["user_id"],
        "username": (f"@{u['username']}" if u.get("username") else (u.get("first_name") or "Foydalanuvchi")),
        "hasUsername": bool(u.get("username")),
        "photoUrl": u.get("photo_url"),
        "balance": round(float(u.get("balance") or 0), 2),
        "invited": u.get("invited_count") or 0,
        "earned": round(float(u.get("earned") or 0), 2),
        "joined": (u.get("joined_at") or "")[:10],
        "blocked": bool(u.get("blocked")),
    }


async def auth(request: web.Request) -> web.Response:
    """Web App ochilganda chaqiriladi. Telegram'ning o'z initData'sini tekshiradi,
    foydalanuvchini bazada yaratadi/yangilaydi va unga shaxsiy sessiya tokeni beradi."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)

    verified = _verify_telegram_init_data(str(data.get("initData", "")))
    if not verified or not verified.get("user"):
        return web.json_response({"ok": False, "error": "Telegram orqali tasdiqlab bo'lmadi"}, status=401)

    tg_user = verified["user"]
    telegram_id = tg_user.get("id")
    if not telegram_id:
        return web.json_response({"ok": False, "error": "Foydalanuvchi topilmadi"}, status=400)

    referred_by = None
    start_param = str(data.get("startParam") or verified.get("start_param") or "")
    if start_param.startswith("ref_"):
        try:
            referred_by = int(start_param[4:])
        except ValueError:
            referred_by = None

    db = request.app["db"]
    user_row = await db.get_or_create_user(
        telegram_id,
        tg_user.get("username", "") or "",
        tg_user.get("first_name", "") or "",
        photo_url=tg_user.get("photo_url"),
        referred_by=referred_by,
    )

    bot_username = request.app.get("bot_username") or ""
    return web.json_response({
        "ok": True,
        "token": _make_user_token(telegram_id),
        "user": _user_public(user_row),
        "referralLink": f"https://t.me/{bot_username}?start=ref_{telegram_id}" if bot_username else None,
    })


async def get_pricing(request: web.Request) -> web.Response:
    db = request.app["db"]
    values = {}
    for key, default in DEFAULT_PRICING.items():
        values[key] = await db.get_setting(key) or default
    return web.json_response({
        "ok": True,
        "starsPricePerUnit": float(values["stars_price_per_unit"]),
        "premiumPrices": {
            "3": float(values["premium_price_3"]),
            "6": float(values["premium_price_6"]),
            "12": float(values["premium_price_12"]),
        },
        "cardNumber": values["card_number"],
    })


async def set_pricing(request: web.Request) -> web.Response:
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)

    db = request.app["db"]
    mapping = {
        "starsPricePerUnit": "stars_price_per_unit",
        "premiumPrice3": "premium_price_3",
        "premiumPrice6": "premium_price_6",
        "premiumPrice12": "premium_price_12",
        "cardNumber": "card_number",
    }
    for field, key in mapping.items():
        if field in data:
            await db.set_setting(key, str(data[field]))
    return web.json_response({"ok": True})


async def admin_verify(request: web.Request) -> web.Response:
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    return web.json_response({"ok": True})


def _require_admin(request: web.Request) -> bool:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[len("Bearer "):] if auth_header.startswith("Bearer ") else ""
    return bool(token) and _verify_token(token)


async def admin_heartbeat(request: web.Request) -> web.Response:
    """Admin panel ochiq turganda webapp har ~20 sekundda shu yerga so'rov yuboradi."""
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    mark_admin_present()
    return web.json_response({"ok": True})


async def admin_leave(request: web.Request) -> web.Response:
    """Admin panelni yopganda/chiqqanda webapp shu yerga xabar beradi (heartbeat'ni kutmasdan)."""
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    mark_admin_left()
    return web.json_response({"ok": True})


async def create_order(request: web.Request) -> web.Response:
    """Web App'dan yangi buyurtma kelganda chaqiriladi. Narx serverning o'zida
    (joriy pricing sozlamalaridan) qayta hisoblanadi - clientdan kelgan narxga
    ishonilmaydi. Balans yetarli bo'lmasa buyurtma UMUMAN qabul qilinmaydi;
    yetarli bo'lsa darhol yechib olinadi (admin tasdiqlashini kutmasdan)."""
    telegram_id = _require_user(request)
    if telegram_id is None:
        return web.json_response({"ok": False, "error": "Avtorizatsiyadan o'ting"}, status=401)

    try:
        data = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)

    db = request.app["db"]
    buyer = await db.get_user(telegram_id)
    if not buyer:
        return web.json_response({"ok": False, "error": "Foydalanuvchi topilmadi"}, status=404)
    if buyer.get("blocked"):
        return web.json_response({"ok": False, "error": "Hisobingiz bloklangan"}, status=403)

    order_type = str(data.get("type", "")).strip()
    recipient = str(data.get("recipient", "self")).strip()
    recipient_username = str(data.get("recipientUsername", "") or "").strip()

    if recipient == "self" and not buyer.get("username"):
        return web.json_response({
            "ok": False,
            "error": "Avval Telegram sozlamalaridan username o'rnating",
        }, status=400)
    if recipient == "friend" and not recipient_username.startswith("@"):
        return web.json_response({"ok": False, "error": "Do'stingizning @username'ini kiriting"}, status=400)

    pricing_resp = await get_pricing(request)
    pricing = json.loads(pricing_resp.text)

    if order_type == "stars":
        amount = int(data.get("amount", 0) or 0)
        if amount < 50:
            return web.json_response({"ok": False, "error": "Minimal miqdor: 50 ta Stars"}, status=400)
        price = round(amount * pricing["starsPricePerUnit"], 2)
        summary = f"\u2b50 {amount} Stars \u2014 " + (
            "o'ziga" if recipient == "self" else f"{recipient_username}ga"
        )
    elif order_type == "premium":
        months = str(int(data.get("months", 0) or 0))
        if months not in pricing["premiumPrices"]:
            return web.json_response({"ok": False, "error": "Noto'g'ri muddat"}, status=400)
        price = round(pricing["premiumPrices"][months], 2)
        summary = f"\U0001F48E Premium {months} oy \u2014 " + (
            "o'ziga" if recipient == "self" else f"{recipient_username}ga"
        )
    else:
        return web.json_response({"ok": False, "error": "Noto'g'ri buyurtma turi"}, status=400)

    if buyer["balance"] < price:
        return web.json_response({
            "ok": False,
            "error": f"Balans yetarli emas. Kerak: {price}$, balansingizda: {round(buyer['balance'], 2)}$",
        }, status=402)

    order_id = f"ORD-{int(time.time() * 1000) % 10_000_000}"
    new_balance = await db.adjust_balance(telegram_id, -price)
    await db.add_order(order_id, telegram_id, order_type, summary, amount_usd=price)

    if not admin_is_present():
        bot = request.app.get("bot")
        if bot is not None:
            text = f"\U0001F514 <b>Yangi buyurtma keldi!</b>\n\n№ {order_id}\n{summary}\nSumma: {price}$"
            for admin_id in config.ADMIN_IDS:
                try:
                    await bot.send_message(admin_id, text)
                except Exception:
                    pass

    return web.json_response({"ok": True, "orderId": order_id, "newBalance": new_balance})


async def admin_list_orders(request: web.Request) -> web.Response:
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    db = request.app["db"]
    orders = await db.list_orders()
    users_by_id = {u["user_id"]: u for u in await db.list_users()}
    result = []
    for o in orders:
        buyer = users_by_id.get(o.get("user_id"))
        result.append({
            "id": o["id"], "type": o["type"], "summary": o["summary"],
            "status": o["status"], "amountUsd": round(float(o.get("amount_usd") or 0), 2),
            "createdAt": o["created_at"],
            "buyerId": o.get("user_id"),
            "buyerUsername": (f"@{buyer['username']}" if buyer and buyer.get("username") else "?"),
        })
    return web.json_response({"ok": True, "orders": result})


async def admin_order_action(request: web.Request) -> web.Response:
    """POST /api/admin/orders/{id}/approve yoki /cancel.
    Cancel qilinsa, yechib olingan summa foydalanuvchi balansiga qaytariladi."""
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)

    order_id = request.match_info["order_id"]
    action = request.match_info["action"]
    db = request.app["db"]
    order = await db.get_order(order_id)
    if not order:
        return web.json_response({"ok": False, "error": "Buyurtma topilmadi"}, status=404)
    if order["status"] != "Kutilmoqda":
        return web.json_response({"ok": False, "error": "Bu buyurtma allaqachon yakunlangan"}, status=400)

    if action == "approve":
        await db.set_order_status(order_id, "Bajarildi")
    elif action == "cancel":
        await db.set_order_status(order_id, "Bekor qilindi")
        if order.get("user_id"):
            await db.adjust_balance(order["user_id"], float(order.get("amount_usd") or 0))
    else:
        return web.json_response({"ok": False, "error": "Noma'lum amal"}, status=400)

    bot = request.app.get("bot")
    if bot is not None and order.get("user_id"):
        text = (
            f"\u2705 Buyurtmangiz bajarildi!\n№ {order_id}\n{order['summary']}"
            if action == "approve"
            else f"\u274C Buyurtmangiz bekor qilindi.\n№ {order_id}\n{order['summary']}\n"
                 f"To'langan summa balansingizga qaytarildi."
        )
        try:
            await bot.send_message(order["user_id"], text)
        except Exception:
            pass

    return web.json_response({"ok": True})


async def admin_list_users(request: web.Request) -> web.Response:
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    db = request.app["db"]
    users = await db.list_users()
    return web.json_response({"ok": True, "users": [_user_public(u) for u in users]})


async def admin_set_blocked(request: web.Request) -> web.Response:
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)
    user_id = int(request.match_info["user_id"])
    db = request.app["db"]
    await db.set_blocked(user_id, bool(data.get("blocked")))
    return web.json_response({"ok": True})


async def admin_adjust_balance(request: web.Request) -> web.Response:
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    try:
        data = await request.json()
        delta = float(data.get("delta"))
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)

    user_id = int(request.match_info["user_id"])
    db = request.app["db"]
    if not await db.get_user(user_id):
        return web.json_response({"ok": False, "error": "Foydalanuvchi topilmadi"}, status=404)
    new_balance = await db.adjust_balance(user_id, delta)

    bot = request.app.get("bot")
    if bot is not None and delta > 0:
        try:
            await bot.send_message(user_id, f"\U0001F4B0 Balansingiz {delta}$ ga oshirildi. Joriy balans: {new_balance}$")
        except Exception:
            pass

    return web.json_response({"ok": True, "newBalance": new_balance})


async def admin_message_user(request: web.Request) -> web.Response:
    """Faqat TANLANGAN bitta foydalanuvchiga xabar yuboradi (broadcast emas)."""
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    try:
        data = await request.json()
        text = str(data.get("text", "")).strip()
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)
    if not text:
        return web.json_response({"ok": False, "error": "Xabar matni bo'sh"}, status=400)

    user_id = int(request.match_info["user_id"])
    bot = request.app.get("bot")
    if bot is None:
        return web.json_response({"ok": False, "error": "Bot ulanmagan"}, status=503)
    try:
        await bot.send_message(user_id, text)
    except Exception as e:
        return web.json_response({"ok": False, "error": f"Yuborilmadi: {e}"}, status=502)
    return web.json_response({"ok": True})


async def admin_broadcast(request: web.Request) -> web.Response:
    """Admin panel'dagi 'Barchaga yuborish' shu yerni chaqiradi - xabar
    WEB APP orqali emas, aynan BOT orqali (Telegram xabari sifatida) boradi."""
    if not _require_admin(request):
        return web.json_response({"ok": False}, status=401)
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Noto'g'ri so'rov"}, status=400)

    text = str(data.get("text", "")).strip()
    if not text:
        return web.json_response({"ok": False, "error": "Xabar matni bo'sh"}, status=400)

    bot = request.app.get("bot")
    db = request.app["db"]
    if bot is None:
        return web.json_response({"ok": False, "error": "Bot ulanmagan"}, status=503)

    sent, failed = 0, 0
    for u in await db.list_users():
        try:
            await bot.send_message(u["user_id"], text)
            sent += 1
        except Exception:
            failed += 1

    return web.json_response({"ok": True, "sent": sent, "failed": failed})


def create_app(bot=None, db=None, bot_username=None) -> web.Application:
    # Chek rasmlari (base64) 1MB'dan katta bo'lishi mumkin - standart limitni oshiramiz.
    app = web.Application(middlewares=[cors_middleware], client_max_size=12 * 1024 * 1024)
    app["bot"] = bot
    app["db"] = db
    app["bot_username"] = bot_username
    app.router.add_get("/api/health", health)

    app.router.add_post("/api/auth", auth)
    app.router.add_options("/api/auth", lambda r: web.Response())

    app.router.add_post("/api/payments", submit_payment)
    app.router.add_options("/api/payments", lambda r: web.Response())
    app.router.add_get("/api/admin/payments", admin_list_payments)
    app.router.add_post("/api/admin/payments/{req_id}/{action}", admin_payment_action)
    app.router.add_options("/api/admin/payments/{req_id}/{action}", lambda r: web.Response())

    app.router.add_get("/api/pricing", get_pricing)
    app.router.add_post("/api/admin/pricing", set_pricing)
    app.router.add_options("/api/admin/pricing", lambda r: web.Response())

    app.router.add_post("/api/admin/login", admin_login)
    app.router.add_options("/api/admin/login", lambda r: web.Response())
    app.router.add_get("/api/admin/verify", admin_verify)
    app.router.add_post("/api/admin/heartbeat", admin_heartbeat)
    app.router.add_options("/api/admin/heartbeat", lambda r: web.Response())
    app.router.add_post("/api/admin/leave", admin_leave)
    app.router.add_options("/api/admin/leave", lambda r: web.Response())

    app.router.add_post("/api/orders", create_order)
    app.router.add_options("/api/orders", lambda r: web.Response())

    app.router.add_get("/api/admin/orders", admin_list_orders)
    app.router.add_post("/api/admin/orders/{order_id}/{action}", admin_order_action)
    app.router.add_options("/api/admin/orders/{order_id}/{action}", lambda r: web.Response())

    app.router.add_get("/api/admin/users", admin_list_users)
    app.router.add_post("/api/admin/users/{user_id}/block", admin_set_blocked)
    app.router.add_options("/api/admin/users/{user_id}/block", lambda r: web.Response())
    app.router.add_post("/api/admin/users/{user_id}/adjust-balance", admin_adjust_balance)
    app.router.add_options("/api/admin/users/{user_id}/adjust-balance", lambda r: web.Response())
    app.router.add_post("/api/admin/users/{user_id}/message", admin_message_user)
    app.router.add_options("/api/admin/users/{user_id}/message", lambda r: web.Response())

    app.router.add_post("/api/admin/broadcast", admin_broadcast)
    app.router.add_options("/api/admin/broadcast", lambda r: web.Response())

    app.router.add_get("/api/admin/admins", admin_list_admins)
    app.router.add_post("/api/admin/admins", admin_add_admin)
    app.router.add_options("/api/admin/admins", lambda r: web.Response())
    app.router.add_post("/api/admin/admins/{target_login}/remove", admin_remove_admin)
    app.router.add_options("/api/admin/admins/{target_login}/remove", lambda r: web.Response())
    app.router.add_post("/api/admin/admins/{target_login}/password", admin_update_password)
    app.router.add_options("/api/admin/admins/{target_login}/password", lambda r: web.Response())
    return app


async def run_webserver(bot=None, db=None, bot_username=None):
    app = create_app(bot=bot, db=db, bot_username=bot_username)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", config.PORT)
    await site.start()
    return runner
