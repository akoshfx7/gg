import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.memory import MemoryStorage

import config
from config import BOT_TOKEN
from database import Database
from handlers.admin import admin_router
from handlers.user import user_router
from webserver import run_webserver


async def main():
    logging.basicConfig(level=logging.INFO)

    db = Database()
    await db.connect()
    await db.ensure_owner_admin(config.ADMIN_PANEL_LOGIN, config.ADMIN_PANEL_PASSWORD)

    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
    dp = Dispatcher(storage=MemoryStorage())

    me = await bot.get_me()

    # Admin router birinchi ro'yxatga olinadi, shunda admin tugmalari
    # oddiy foydalanuvchi handlerlaridan oldin ushlanadi.
    dp.include_router(admin_router)
    dp.include_router(user_router)

    # Web App'ning admin login so'rovlarini qabul qiladigan kichik HTTP server.
    # Bot'ning o'zi (polling, handlerlar) bunga umuman bog'liq emas.
    webserver_runner = await run_webserver(bot=bot, db=db, bot_username=me.username)

    await bot.delete_webhook(drop_pending_updates=True)
    try:
        await dp.start_polling(bot, db=db)
    finally:
        await webserver_runner.cleanup()
        await db.close()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
