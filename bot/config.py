import os
import secrets

from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()]
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://example.com")
DB_PATH = os.getenv("DB_PATH", "starnest.db")

# ---- Web App admin panel authentication (server-side) ----
# Login/parol endi kodda emas, faqat Railway Variables'da saqlanadi.
ADMIN_PANEL_LOGIN = os.getenv("ADMIN_PANEL_LOGIN", "")
ADMIN_PANEL_PASSWORD = os.getenv("ADMIN_PANEL_PASSWORD", "")
# Tokenlarni imzolash uchun maxfiy kalit. O'rnatilmasa, har ishga tushishda
# tasodifiy generatsiya qilinadi (bu holda qayta deploy'da eski tokenlar bekor bo'ladi).
ADMIN_PANEL_SECRET = os.getenv("ADMIN_PANEL_SECRET") or secrets.token_hex(32)
# Webapp'dan kiruvchi so'rovlarga ruxsat berish uchun (CORS). Bo'sh bo'lsa - hammaga ochiq.
WEBAPP_ORIGIN = os.getenv("WEBAPP_ORIGIN", "")
# Railway HTTP service uchun avtomatik beradigan port.
PORT = int(os.getenv("PORT", "8080"))

if not BOT_TOKEN:
    raise RuntimeError(
        "BOT_TOKEN topilmadi. .env faylini yarating (.env.example dan nusxa oling) "
        "va BOT_TOKEN qiymatini kiriting."
    )

if not ADMIN_IDS:
    print(
        "OGOHLANTIRISH: ADMIN_IDS bo'sh - hech kim admin panelga kira olmaydi. "
        ".env faylida ADMIN_IDS ga o'z Telegram ID'ingizni yozing."
    )

if not ADMIN_PANEL_LOGIN or not ADMIN_PANEL_PASSWORD:
    print(
        "OGOHLANTIRISH: ADMIN_PANEL_LOGIN / ADMIN_PANEL_PASSWORD o'rnatilmagan - "
        "Web App admin paneliga hech kim kira olmaydi. Railway Variables'da "
        "ikkalasini ham kiriting."
    )
