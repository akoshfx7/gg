from aiogram import Bot
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from database import Database

TYPE_ICON = {"telegram": "\U0001F4E2", "instagram": "\U0001F4F8", "youtube": "\u25B6\uFE0F"}


async def get_missing_channels(bot: Bot, user_id: int, db: Database) -> list:
    """Returns the list of mandatory channels the user is NOT yet subscribed to.

    Telegram channels are verified for real via get_chat_member. Instagram and
    YouTube can't be verified by the Bot API, so those only require the user to
    tap the button once (tracked in user_confirms).
    """
    channels = await db.get_channels()
    missing = []
    for ch in channels:
        if ch["type"] == "telegram":
            try:
                member = await bot.get_chat_member(ch["chat_id"], user_id)
                if member.status in ("left", "kicked"):
                    missing.append(ch)
            except Exception:
                # Bot kanalga admin qilib qo'shilmagan yoki chat_id noto'g'ri bo'lsa
                # ham foydalanuvchini bloklab qo'ymaslik uchun shu holatni alohida
                # log qilish tavsiya etiladi - hozircha ehtiyot yuzasidan "obuna emas"
                # deb hisoblanadi.
                missing.append(ch)
        else:
            if not await db.is_confirmed(user_id, ch["id"]):
                missing.append(ch)
    return missing


def build_subscribe_keyboard(missing: list) -> InlineKeyboardMarkup:
    rows = []
    for ch in missing:
        icon = TYPE_ICON.get(ch["type"], "\U0001F517")
        if ch["type"] == "telegram":
            rows.append([InlineKeyboardButton(text=f"{icon} {ch['title']}", url=ch["url"])])
        else:
            rows.append([InlineKeyboardButton(
                text=f"{icon} {ch['title']}", callback_data=f"confirm_{ch['id']}"
            )])
    rows.append([InlineKeyboardButton(text="\u2705 Tekshirish", callback_data="check_subs")])
    return InlineKeyboardMarkup(inline_keyboard=rows)
