from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from config import ADMIN_IDS
from database import Database
from keyboards import (
    admin_contact_edit_kb,
    buttons_menu_kb,
    channel_type_kb,
    channels_list_kb,
    texts_menu_kb,
)
from states import AdminStates

admin_router = Router()
admin_router.message.filter(F.from_user.id.in_(ADMIN_IDS))
admin_router.callback_query.filter(F.from_user.id.in_(ADMIN_IDS))

TEXT_LABELS = {
    "welcome_text": "\U0001F44B Salomlashuv matni",
    "guide_text": "\U0001F4D5 Qo'llanma matni",
    "admin_contact_text": "\U0001F935\U0001F3FC\u200D\u2642\uFE0F Adminlar bilan bog'lanish matni",
}
BUTTON_LABELS = {
    "btn_guide_label": "\U0001F4D5 Qo'llanma tugmasi",
    "btn_admins_label": "\U0001F935\U0001F3FC\u200D\u2642\uFE0F Adminlar tugmasi",
    "btn_shop_label": "\u2B50\uFE0F Do'kon tugmasi",
}
CHANNEL_ICONS = {"telegram": "\U0001F4E2", "instagram": "\U0001F4F8", "youtube": "\u25B6\uFE0F"}


# ---------------------------------------------------------------- Matn qo'shish
@admin_router.message(F.text == "\U0001F4DDMatn qo'shish")
async def admin_texts_menu(message: Message):
    await message.answer("Qaysi matnni o'zgartirmoqchisiz?", reply_markup=texts_menu_kb())


@admin_router.callback_query(F.data.startswith("edit_text_"))
async def cb_edit_text(callback: CallbackQuery, state: FSMContext):
    key = callback.data.replace("edit_text_", "")
    await state.update_data(target_key=key)
    await state.set_state(AdminStates.waiting_text)
    await callback.answer()
    extra = ""
    if key == "welcome_text":
        extra = "\n\nEslatma: matn ichida {name} yozsangiz, u foydalanuvchi ismi bilan almashadi."
    await callback.message.answer(f"\u270F\uFE0F Yangi matnni yuboring ({TEXT_LABELS.get(key, key)}):{extra}")


@admin_router.message(AdminStates.waiting_text)
async def save_text(message: Message, state: FSMContext, db: Database):
    data = await state.get_data()
    key = data["target_key"]
    await db.set_setting(key, message.html_text or message.text or "")
    await state.clear()
    await message.answer(f"\u2705 {TEXT_LABELS.get(key, key)} yangilandi.")


# ---------------------------------------------------------------- Adminlar (bog'lanish matni)
@admin_router.message(F.text == "\U0001F935\U0001F3FC\u200D\u2642\uFE0FAdminlar")
async def admin_contact_menu(message: Message, db: Database):
    text = await db.get_setting("admin_contact_text")
    await message.answer(f"Joriy matn:\n\n{text}", reply_markup=admin_contact_edit_kb())


@admin_router.callback_query(F.data == "edit_admin_contact")
async def cb_edit_admin_contact(callback: CallbackQuery, state: FSMContext):
    await state.update_data(target_key="admin_contact_text")
    await state.set_state(AdminStates.waiting_text)
    await callback.answer()
    await callback.message.answer("\u270F\uFE0F Yangi matnni yuboring (admin bilan bog'lanish ma'lumoti):")


# ---------------------------------------------------------------- Tugmalarni boshqarish
@admin_router.message(F.text == "\u270F\uFE0FTugmalarni boshqarish")
async def admin_buttons_menu(message: Message):
    await message.answer("Qaysi tugma nomini o'zgartirmoqchisiz?", reply_markup=buttons_menu_kb())


@admin_router.callback_query(F.data.startswith("edit_btn_"))
async def cb_edit_button(callback: CallbackQuery, state: FSMContext):
    key = callback.data.replace("edit_btn_", "")
    await state.update_data(target_key=key)
    await state.set_state(AdminStates.waiting_button_label)
    await callback.answer()
    await callback.message.answer(f"\u270F\uFE0F Yangi nomni yuboring ({BUTTON_LABELS.get(key, key)}):")


@admin_router.message(AdminStates.waiting_button_label)
async def save_button_label(message: Message, state: FSMContext, db: Database):
    data = await state.get_data()
    key = data["target_key"]
    await db.set_setting(key, message.text or "")
    await state.clear()
    await message.answer(
        f"\u2705 Tugma nomi yangilandi: {message.text}\n\n"
        "Barcha foydalanuvchilar uchun bu tugma keyingi menyu ko'rsatilganda "
        "(masalan /start bosilganda) yangi nom bilan chiqadi va ishlashda davom etadi."
    )


# ---------------------------------------------------------------- Majburiy obunalar
@admin_router.message(F.text == "\u2795Majburiy obunalar")
async def admin_channels_menu(message: Message, db: Database):
    channels = await db.get_channels()
    if not channels:
        text = "Hozircha majburiy obunalar yo'q."
    else:
        lines = [
            f"{CHANNEL_ICONS.get(c['type'], '\U0001F517')} {c['title']} \u2014 {c['url']}"
            for c in channels
        ]
        text = "Joriy majburiy obunalar (o'chirish uchun bosing):\n\n" + "\n".join(lines)
    await message.answer(text, reply_markup=channels_list_kb(channels))


@admin_router.callback_query(F.data == "addch")
async def cb_add_channel(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.answer()
    await callback.message.answer("Kanal turini tanlang:", reply_markup=channel_type_kb())


@admin_router.callback_query(F.data.startswith("chtype_"))
async def cb_channel_type(callback: CallbackQuery, state: FSMContext):
    type_ = callback.data.replace("chtype_", "")
    await state.update_data(channel_type=type_)
    await state.set_state(AdminStates.waiting_channel_title)
    await callback.answer()
    await callback.message.answer("Kanal nomini yuboring (masalan: StarNest rasmiy kanali):")


@admin_router.message(AdminStates.waiting_channel_title)
async def channel_title_step(message: Message, state: FSMContext):
    await state.update_data(channel_title=message.text)
    await state.set_state(AdminStates.waiting_channel_url)
    await message.answer(
        "Endi kanal havolasini yuboring\n"
        "(masalan: https://t.me/starnest yoki https://instagram.com/starnest):"
    )


@admin_router.message(AdminStates.waiting_channel_url)
async def channel_url_step(message: Message, state: FSMContext, db: Database):
    await state.update_data(channel_url=message.text)
    data = await state.get_data()

    if data["channel_type"] == "telegram":
        await state.set_state(AdminStates.waiting_channel_chatid)
        await message.answer(
            "\U0001F4CC Botni shu kanalga <b>admin</b> qilib qo'shing, so'ng kanal "
            "username'ini (masalan: @starnest) yoki chat ID'sini yuboring:"
        )
        return

    # Instagram / YouTube uchun chat_id kerak emas - haqiqiy tekshirish imkonsiz
    await db.add_channel(data["channel_type"], data["channel_title"], data["channel_url"], None)
    await state.clear()
    await message.answer(
        "\u2705 Majburiy obuna qo'shildi.\n\n"
        "\u2139\uFE0F Instagram/YouTube uchun havolani bosgan foydalanuvchi avtomatik "
        "\"tekshirildi\" deb hisoblanadi (chunki bularni bot orqali real tekshirib bo'lmaydi)."
    )


@admin_router.message(AdminStates.waiting_channel_chatid)
async def channel_chatid_step(message: Message, state: FSMContext, db: Database):
    data = await state.get_data()
    chat_id = message.text.strip()
    try:
        await message.bot.get_chat_member(chat_id, message.from_user.id)
    except Exception:
        await message.answer(
            "\u26A0\uFE0F Bot bu kanalga admin sifatida qo'shilmagan yoki "
            "username/ID noto'g'ri. Iltimos, botni kanalga admin qiling va qaytadan yuboring."
        )
        return

    await db.add_channel("telegram", data["channel_title"], data["channel_url"], chat_id)
    await state.clear()
    await message.answer("\u2705 Majburiy obuna (Telegram kanal) qo'shildi.")


@admin_router.callback_query(F.data.startswith("delch_"))
async def cb_delete_channel(callback: CallbackQuery, db: Database):
    channel_id = int(callback.data.split("_", 1)[1])
    await db.delete_channel(channel_id)
    await callback.answer("\U0001F5D1 O'chirildi")
    channels = await db.get_channels()
    try:
        await callback.message.edit_reply_markup(reply_markup=channels_list_kb(channels))
    except Exception:
        pass
