from datetime import datetime, timezone
from typing import Optional

import aiosqlite

from config import DB_PATH

DEFAULT_SETTINGS = {
    "welcome_text": (
        "\U0001F44B Assalomu alaykum, {name}!\n\n"
        "\u2B50\uFE0F <b>StarNest</b> botiga xush kelibsiz \u2014 bu yerda siz Telegram "
        "Stars va Premium'ni eng qulay narxlarda sotib olishingiz mumkin.\n\n"
        "Quyidagi tugmalardan birini tanlang \U0001F447"
    ),
    "guide_text": (
        "\U0001F4D5 <b>Foydalanuvchi qo'llanmasi</b>\n\n"
        "1. \u2B50\uFE0F \"Stars va Premium sotib olish\" tugmasi orqali Mini App'ni oching\n"
        "2. Kerakli paketni yoki muddatni tanlang\n"
        "3. Balansingizni to'ldiring yoki mavjud balansdan foydalaning\n"
        "4. Buyurtmangiz admin tomonidan tasdiqlanishini kuting"
    ),
    "admin_contact_text": "\U0001F935\U0001F3FC\u200D\u2642\uFE0F Admin bilan bog'lanish: @starnest_admin",
    "btn_guide_label": "\U0001F4D5Foydalanuvchi qo'llanmasi",
    "btn_admins_label": "\U0001F935\U0001F3FC\u200D\u2642\uFE0FAdminlar",
    "btn_shop_label": "\u2B50\uFE0FStars va Premium sotib olish\U0001F48E",
}


class Database:
    """Thin async wrapper around a single SQLite connection."""

    def __init__(self, path: str = DB_PATH):
        self.path = path
        self.conn: Optional[aiosqlite.Connection] = None

    async def connect(self):
        self.conn = await aiosqlite.connect(self.path)
        self.conn.row_factory = aiosqlite.Row
        await self._create_tables()
        await self._seed_defaults()

    async def close(self):
        if self.conn:
            await self.conn.close()

    async def _create_tables(self):
        await self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                joined_at TEXT,
                balance REAL DEFAULT 0,
                invited_by INTEGER,
                invited_count INTEGER DEFAULT 0,
                earned REAL DEFAULT 0,
                blocked INTEGER DEFAULT 0,
                photo_url TEXT
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );

            CREATE TABLE IF NOT EXISTS channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                chat_id TEXT
            );

            CREATE TABLE IF NOT EXISTS user_confirms (
                user_id INTEGER NOT NULL,
                channel_id INTEGER NOT NULL,
                confirmed_at TEXT,
                PRIMARY KEY (user_id, channel_id)
            );

            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                type TEXT,
                summary TEXT,
                amount_usd REAL DEFAULT 0,
                status TEXT DEFAULT 'Kutilmoqda',
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS admins (
                login TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                is_owner INTEGER DEFAULT 0,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS payment_requests (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                amount_usd REAL DEFAULT 0,
                receipt_data TEXT,
                status TEXT DEFAULT 'Kutilmoqda',
                created_at TEXT
            );
            """
        )
        # Eski (Volume'da saqlangan) bazalarda yangi ustunlar yo'q bo'lishi mumkin -
        # xavfsiz tarzda qo'shib qo'yamiz (allaqachon bo'lsa xatoni e'tiborsiz qoldiramiz).
        for stmt in [
            "ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0",
            "ALTER TABLE users ADD COLUMN invited_by INTEGER",
            "ALTER TABLE users ADD COLUMN invited_count INTEGER DEFAULT 0",
            "ALTER TABLE users ADD COLUMN earned REAL DEFAULT 0",
            "ALTER TABLE users ADD COLUMN blocked INTEGER DEFAULT 0",
            "ALTER TABLE users ADD COLUMN photo_url TEXT",
            "ALTER TABLE orders ADD COLUMN user_id INTEGER",
            "ALTER TABLE orders ADD COLUMN amount_usd REAL DEFAULT 0",
        ]:
            try:
                await self.conn.execute(stmt)
            except Exception:
                pass
        await self.conn.commit()

    async def _seed_defaults(self):
        for key, value in DEFAULT_SETTINGS.items():
            await self.conn.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, value)
            )
        await self.conn.commit()

    # ---------------- settings ----------------
    async def get_setting(self, key: str) -> str:
        cur = await self.conn.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = await cur.fetchone()
        return row["value"] if row else DEFAULT_SETTINGS.get(key, "")

    async def get_settings(self, keys: list) -> dict:
        result = {}
        for k in keys:
            result[k] = await self.get_setting(k)
        return result

    async def set_setting(self, key: str, value: str):
        await self.conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )
        await self.conn.commit()

    # ---------------- users ----------------
    async def add_user(self, user_id: int, username: str, first_name: str):
        cur = await self.conn.execute("SELECT 1 FROM users WHERE user_id = ?", (user_id,))
        if await cur.fetchone():
            return
        await self.conn.execute(
            "INSERT INTO users (user_id, username, first_name, joined_at) VALUES (?, ?, ?, ?)",
            (user_id, username, first_name, datetime.now(timezone.utc).isoformat()),
        )
        await self.conn.commit()

    REFERRAL_BONUS_USD = 0.5

    async def get_or_create_user(
        self, user_id: int, username: str, first_name: str,
        photo_url: str = None, referred_by: int = None,
    ) -> dict:
        """Web App orqali kirgan haqiqiy foydalanuvchini yaratadi (agar mavjud
        bo'lmasa) yoki bor bo'lsa uning joriy ma'lumotini qaytaradi. Ma'lumotlar
        (balans, buyurtmalar tarixi, referal statistikasi) SQLite'da doimiy
        saqlanadi - foydalanuvchi qachon qaytib kirmasin yo'qolmaydi."""
        cur = await self.conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = await cur.fetchone()

        if row is None:
            is_self_ref = referred_by is not None and referred_by == user_id
            ref = referred_by if (referred_by and not is_self_ref) else None
            await self.conn.execute(
                "INSERT INTO users (user_id, username, first_name, joined_at, balance, "
                "invited_by, invited_count, earned, blocked, photo_url) "
                "VALUES (?, ?, ?, ?, 0, ?, 0, 0, 0, ?)",
                (user_id, username, first_name, datetime.now(timezone.utc).isoformat(), ref, photo_url),
            )
            if ref is not None:
                referrer = await self.conn.execute("SELECT 1 FROM users WHERE user_id = ?", (ref,))
                if await referrer.fetchone():
                    await self.conn.execute(
                        "UPDATE users SET invited_count = invited_count + 1, "
                        "earned = earned + ?, balance = balance + ? WHERE user_id = ?",
                        (self.REFERRAL_BONUS_USD, self.REFERRAL_BONUS_USD, ref),
                    )
            await self.conn.commit()
        else:
            # Username/ism/rasm o'zgargan bo'lishi mumkin - yangilab qo'yamiz,
            # lekin balans va tarixga tegmaymiz.
            await self.conn.execute(
                "UPDATE users SET username = ?, first_name = ?, photo_url = COALESCE(?, photo_url) "
                "WHERE user_id = ?",
                (username, first_name, photo_url, user_id),
            )
            await self.conn.commit()

        cur = await self.conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        return dict(await cur.fetchone())

    async def get_user(self, user_id: int) -> Optional[dict]:
        cur = await self.conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = await cur.fetchone()
        return dict(row) if row else None

    async def list_users(self) -> list:
        cur = await self.conn.execute("SELECT * FROM users ORDER BY joined_at DESC")
        rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def adjust_balance(self, user_id: int, delta: float) -> float:
        await self.conn.execute(
            "UPDATE users SET balance = ROUND(balance + ?, 2) WHERE user_id = ?", (delta, user_id)
        )
        await self.conn.commit()
        cur = await self.conn.execute("SELECT balance FROM users WHERE user_id = ?", (user_id,))
        row = await cur.fetchone()
        return row["balance"] if row else 0.0

    async def set_blocked(self, user_id: int, blocked: bool):
        await self.conn.execute("UPDATE users SET blocked = ? WHERE user_id = ?", (int(blocked), user_id))
        await self.conn.commit()

    async def users_count(self) -> int:
        cur = await self.conn.execute("SELECT COUNT(*) as c FROM users")
        row = await cur.fetchone()
        return row["c"]

    async def all_user_ids(self) -> list:
        cur = await self.conn.execute("SELECT user_id FROM users")
        rows = await cur.fetchall()
        return [r["user_id"] for r in rows]

    # ---------------- channels ----------------
    async def add_channel(self, type_: str, title: str, url: str, chat_id):
        await self.conn.execute(
            "INSERT INTO channels (type, title, url, chat_id) VALUES (?, ?, ?, ?)",
            (type_, title, url, chat_id),
        )
        await self.conn.commit()

    async def get_channels(self) -> list:
        cur = await self.conn.execute("SELECT * FROM channels ORDER BY id")
        rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def get_channel(self, channel_id: int):
        cur = await self.conn.execute("SELECT * FROM channels WHERE id = ?", (channel_id,))
        row = await cur.fetchone()
        return dict(row) if row else None

    async def delete_channel(self, channel_id: int):
        await self.conn.execute("DELETE FROM channels WHERE id = ?", (channel_id,))
        await self.conn.execute("DELETE FROM user_confirms WHERE channel_id = ?", (channel_id,))
        await self.conn.commit()

    # ---------------- manual confirms (instagram / youtube) ----------------
    async def confirm_channel(self, user_id: int, channel_id: int):
        await self.conn.execute(
            "INSERT OR IGNORE INTO user_confirms (user_id, channel_id, confirmed_at) VALUES (?, ?, ?)",
            (user_id, channel_id, datetime.now(timezone.utc).isoformat()),
        )
        await self.conn.commit()

    async def is_confirmed(self, user_id: int, channel_id: int) -> bool:
        cur = await self.conn.execute(
            "SELECT 1 FROM user_confirms WHERE user_id = ? AND channel_id = ?",
            (user_id, channel_id),
        )
        return (await cur.fetchone()) is not None

    # ---------------- orders (Web App'dan keladigan) ----------------
    async def add_order(self, order_id: str, user_id: int, type_: str, summary: str, amount_usd: float = 0):
        await self.conn.execute(
            "INSERT OR IGNORE INTO orders (id, user_id, type, summary, amount_usd, status, created_at) "
            "VALUES (?, ?, ?, ?, ?, 'Kutilmoqda', ?)",
            (order_id, user_id, type_, summary, amount_usd, datetime.now(timezone.utc).isoformat()),
        )
        await self.conn.commit()

    async def get_order(self, order_id: str) -> Optional[dict]:
        cur = await self.conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
        row = await cur.fetchone()
        return dict(row) if row else None

    async def list_orders(self) -> list:
        cur = await self.conn.execute("SELECT * FROM orders ORDER BY created_at DESC")
        rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def set_order_status(self, order_id: str, status: str):
        await self.conn.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
        await self.conn.commit()

    # ---------------- admins (ko'p-adminli boshqaruv) ----------------
    async def ensure_owner_admin(self, login: str, password: str):
        """Birinchi ishga tushirishda .env'dagi asosiy admin login/parolini
        bazaga yozib qo'yadi (agar hali hech qanday admin bo'lmasa)."""
        if not login or not password:
            return
        cur = await self.conn.execute("SELECT 1 FROM admins LIMIT 1")
        if await cur.fetchone():
            return
        await self.conn.execute(
            "INSERT OR IGNORE INTO admins (login, password, is_owner, created_at) VALUES (?, ?, 1, ?)",
            (login, password, datetime.now(timezone.utc).isoformat()),
        )
        await self.conn.commit()

    async def verify_admin(self, login: str, password: str) -> bool:
        cur = await self.conn.execute(
            "SELECT 1 FROM admins WHERE login = ? AND password = ?", (login, password)
        )
        return (await cur.fetchone()) is not None

    async def list_admins(self) -> list:
        cur = await self.conn.execute("SELECT login, is_owner, created_at FROM admins ORDER BY created_at")
        rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def add_admin(self, login: str, password: str) -> bool:
        cur = await self.conn.execute("SELECT 1 FROM admins WHERE login = ?", (login,))
        if await cur.fetchone():
            return False
        await self.conn.execute(
            "INSERT INTO admins (login, password, is_owner, created_at) VALUES (?, ?, 0, ?)",
            (login, password, datetime.now(timezone.utc).isoformat()),
        )
        await self.conn.commit()
        return True

    async def remove_admin(self, login: str) -> bool:
        """Admin o'chirilganda uning login/paroli bazadan butunlay o'chib ketadi -
        shu tarzda u endi admin panelga kira olmaydi."""
        cur = await self.conn.execute("SELECT is_owner FROM admins WHERE login = ?", (login,))
        row = await cur.fetchone()
        if not row or row["is_owner"]:
            return False  # bosh adminni o'chirib bo'lmaydi
        await self.conn.execute("DELETE FROM admins WHERE login = ?", (login,))
        await self.conn.commit()
        return True

    async def update_admin_password(self, login: str, new_password: str) -> bool:
        cur = await self.conn.execute("SELECT 1 FROM admins WHERE login = ?", (login,))
        if not await cur.fetchone():
            return False
        await self.conn.execute("UPDATE admins SET password = ? WHERE login = ?", (new_password, login))
        await self.conn.commit()
        return True

    # ---------------- payment requests (balans to'ldirish) ----------------
    async def add_payment_request(self, req_id: str, user_id: int, amount_usd: float, receipt_data: str):
        await self.conn.execute(
            "INSERT OR IGNORE INTO payment_requests (id, user_id, amount_usd, receipt_data, status, created_at) "
            "VALUES (?, ?, ?, ?, 'Kutilmoqda', ?)",
            (req_id, user_id, amount_usd, receipt_data, datetime.now(timezone.utc).isoformat()),
        )
        await self.conn.commit()

    async def get_payment_request(self, req_id: str) -> Optional[dict]:
        cur = await self.conn.execute("SELECT * FROM payment_requests WHERE id = ?", (req_id,))
        row = await cur.fetchone()
        return dict(row) if row else None

    async def list_payment_requests(self) -> list:
        cur = await self.conn.execute("SELECT * FROM payment_requests ORDER BY created_at DESC")
        rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def set_payment_status(self, req_id: str, status: str):
        await self.conn.execute("UPDATE payment_requests SET status = ? WHERE id = ?", (status, req_id))
        await self.conn.commit()
