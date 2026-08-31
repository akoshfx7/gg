from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.types import CallbackQuery, Message

from config import ADMIN_IDS
from database import Database
from force_sub import build_subscribe_keyboard, get_missing_channels
from keyboards import admin_main_menu, shop_open_kb, user_main_menu

user_router = Router()


async def send_shop_open(bot_target, db: Database):
    """'Stars va Premium sotib olish' tugmasi bosilganda chaqiriladi. Bu yerdan
    ochilgan inline tugma - Telegram HAQIQIY, imzolangan foydalanuvchi
    ma'lumotini (initData) yuboradigan YAGONA usul. Oddiy pastki (reply)
    tugmalarda buni Telegram umuman bermaydi."""
    text = await db.get_setting("shop_open_text")
    await bot_target.answer(text, reply_markup=shop_open_kb())


async def send_welcome(bot_target, db: Database, user_id: int, name: str, force_user_view: bool = False):
    """bot_target - Message yoki CallbackQuery.message, .answer() metodiga ega bo'lishi kifoya."""
    text = (await db.get_setting("welcome_text")).replace("{name}", name or "")
    is_admin = user_id in ADMIN_IDS
    if is_admin and not force_user_view:
        menu = await admin_main_menu(db)
    else:
        menu = await user_main_menu(db, is_admin=is_admin)
    await bot_target.answer(text, reply_markup=menu)


@user_router.message(F.text == "\U0001F451 Admin bo'limi")
async def switch_to_admin_view(message: Message, db: Database):
    if message.from_user.id not in ADMIN_IDS:
        return
    await message.answer("\U0001F451 Admin bo'limiga o'tdingiz.", reply_markup=await admin_main_menu(db))


@user_router.message(F.text == "\U0001F465 Foydalanuvchi bo'limi")
async def switch_to_user_view(message: Message, db: Database):
    if message.from_user.id not in ADMIN_IDS:
        return
    await message.answer(
        "\U0001F465 Foydalanuvchi bo'limiga o'tdingiz.",
        reply_markup=await user_main_menu(db, is_admin=True),
    )


@user_router.message(F.text == "\u2B50\uFE0FStars va Premium sotib olish\U0001F48E")
async def admin_open_shop(message: Message, db: Database):
    if message.from_user.id not in ADMIN_IDS:
        return
    await send_shop_open(message, db)


@user_router.message(CommandStart())
async def cmd_start(message: Message, db: Database):
    user = message.from_user

    referred_by = None
    parts = (message.text or "").split(maxsplit=1)
    if len(parts) == 2 and parts[1].startswith("ref_"):
        try:
            referred_by = int(parts[1][4:])
        except ValueError:
            referred_by = None

    await db.get_or_create_user(user.id, user.username or "", user.first_name or "", referred_by=referred_by)

    missing = await get_missing_channels(message.bot, user.id, db)
    if missing:
        await message.answer(
            "\U0001F4E2 Botdan foydalanish uchun quyidagi kanallarga a'zo bo'ling, "
            "so'ng \u2705 Tekshirish tugmasini bosing:",
            reply_markup=build_subscribe_keyboard(missing),
        )
        return

    await send_welcome(message, db, user.id, user.first_name or "")


@user_router.callback_query(F.data.startswith("confirm_"))
async def cb_confirm_channel(callback: CallbackQuery, db: Database):
    channel_id = int(callback.data.split("_", 1)[1])
    channel = await db.get_channel(channel_id)
    await db.confirm_channel(callback.from_user.id, channel_id)
    await callback.answer("\u2705 Tasdiqlandi!")
    if channel:
        await callback.message.answer(f"\U0001F517 {channel['title']}: {channel['url']}")


@user_router.callback_query(F.data == "check_subs")
async def cb_check_subs(callback: CallbackQuery, db: Database):
    user = callback.from_user
    missing = await get_missing_channels(callback.bot, user.id, db)
    if missing:
        await callback.answer(
            "\u274C Siz hali barcha kanallarga a'zo bo'lmadingiz", show_alert=True
        )
        return
    await callback.answer("\u2705 Tabriklaymiz!")
    try:
        await callback.message.delete()
    except Exception:
        pass
    await send_welcome(callback.message, db, user.id, user.first_name or "")


@user_router.message(F.text)
async def handle_user_menu(message: Message, db: Database):
    # Adminlar o'zining alohida menyusiga ega - bu handler faqat oddiy
    # foydalanuvchilar uchun ishlaydi.
    if message.from_user.id in ADMIN_IDS:
        return

    labels = await db.get_settings(["btn_guide_label", "btn_admins_label", "btn_shop_label"])
    if message.text == labels["btn_guide_label"]:
        await message.answer(await db.get_setting("guide_text"))
    elif message.text == labels["btn_admins_label"]:
        await message.answer(await db.get_setting("admin_contact_text"))
    elif message.text == labels["btn_shop_label"]:
        await send_shop_open(message, db)
