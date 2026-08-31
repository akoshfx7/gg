from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

import config
from database import Database

CHANNEL_ICONS = {"telegram": "\U0001F4E2", "instagram": "\U0001F4F8", "youtube": "\u25B6\uFE0F"}


async def user_main_menu(db: Database, is_admin: bool = False) -> ReplyKeyboardMarkup:
    """Diqqat: bu yerdagi 'do'kon' tugmasi endi web_app EMAS, oddiy matnli tugma -
    chunki Telegram Reply Keyboard'dagi web_app tugmalarida initData HAR DOIM bo'sh
    keladi (bu Telegram'ning o'zining cheklovi). Haqiqiy, imzolangan foydalanuvchi
    ma'lumoti bilan ochilishi uchun shop_open_kb() (inline tugma) ishlatiladi -
    shu tugma bosilganda handlers/user.py shu xabarni yuboradi."""
    labels = await db.get_settings(["btn_guide_label", "btn_admins_label", "btn_shop_label"])
    kb = [
        [
            KeyboardButton(text=labels["btn_guide_label"]),
            KeyboardButton(text=labels["btn_admins_label"]),
        ],
        [KeyboardButton(text=labels["btn_shop_label"])],
    ]
    if is_admin:
        kb.append([KeyboardButton(text="\U0001F451 Admin bo'limi")])
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)


async def admin_main_menu(db: Database) -> ReplyKeyboardMarkup:
    kb = [
        [
            KeyboardButton(text="\U0001F4DDMatn qo'shish"),
            KeyboardButton(text="\U0001F935\U0001F3FC\u200D\u2642\uFE0FAdminlar"),
        ],
        [
            KeyboardButton(text="\u2795Majburiy obunalar"),
            KeyboardButton(text="\u270F\uFE0FTugmalarni boshqarish"),
        ],
        [KeyboardButton(text="\u2B50\uFE0FStars va Premium sotib olish\U0001F48E")],
        [KeyboardButton(text="\U0001F465 Foydalanuvchi bo'limi")],
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)


def shop_open_kb(label: str = "\U0001F680 Mini App'ni ochish") -> InlineKeyboardMarkup:
    """Haqiqiy, Telegram tomonidan imzolangan initData bilan ochiladigan YAGONA
    ishonchli usul - inline (xabar ostidagi) web_app tugmasi."""
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text=label, web_app=WebAppInfo(url=config.WEBAPP_URL))]]
    )


def admin_contact_edit_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="\u270F\uFE0F Tahrirlash", callback_data="edit_admin_contact")]]
    )


def texts_menu_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="\U0001F44B Salomlashuv matni", callback_data="edit_text_welcome_text")],
            [InlineKeyboardButton(text="\U0001F4D5 Qo'llanma matni", callback_data="edit_text_guide_text")],
            [InlineKeyboardButton(
                text="\u2B50\uFE0F Stars/Premium ochilish matni",
                callback_data="edit_text_shop_open_text",
            )],
        ]
    )


def buttons_menu_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="\U0001F4D5 Qo'llanma tugmasi", callback_data="edit_btn_btn_guide_label")],
            [InlineKeyboardButton(text="\U0001F935\U0001F3FC\u200D\u2642\uFE0F Adminlar tugmasi", callback_data="edit_btn_btn_admins_label")],
            [InlineKeyboardButton(text="\u2B50\uFE0F Do'kon tugmasi", callback_data="edit_btn_btn_shop_label")],
        ]
    )


def channel_type_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="\U0001F4E2 Telegram", callback_data="chtype_telegram")],
            [InlineKeyboardButton(text="\U0001F4F8 Instagram", callback_data="chtype_instagram")],
            [InlineKeyboardButton(text="\u25B6\uFE0F YouTube", callback_data="chtype_youtube")],
        ]
    )


def channels_list_kb(channels: list) -> InlineKeyboardMarkup:
    rows = []
    for ch in channels:
        icon = CHANNEL_ICONS.get(ch["type"], "\U0001F517")
        rows.append([InlineKeyboardButton(
            text=f"\u274C {icon} {ch['title']}", callback_data=f"delch_{ch['id']}"
        )])
    rows.append([InlineKeyboardButton(text="\u2795 Qo'shish", callback_data="addch")])
    return InlineKeyboardMarkup(inline_keyboard=rows)
