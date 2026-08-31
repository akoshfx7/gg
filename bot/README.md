# StarNest Bot

Telegram Stars va Premium sotuvchi bot — majburiy obuna, foydalanuvchi menyusi va
to'liq boshqariladigan admin panel bilan.

## Imkoniyatlar

- `/start` da majburiy obuna tekshiruvi (Telegram — real, Bot API orqali;
  Instagram/YouTube — havolani bir marta bosgach avtomatik "tekshirildi" deb belgilanadi)
- Foydalanuvchi menyusi: qo'llanma, adminlar bilan bog'lanish, Mini App tugmasi
- Admin panel:
  - **Matn qo'shish** — salomlashuv va qo'llanma matnlarini tahrirlash
  - **Adminlar** — foydalanuvchilarga ko'rsatiladigan bog'lanish matnini tahrirlash
  - **Majburiy obunalar** — Telegram/Instagram/YouTube kanal qo'shish, ro'yxatini
    ko'rish, o'chirish
  - **Tugmalarni boshqarish** — foydalanuvchi menyusidagi tugma nomlarini
    o'zgartirish (barcha foydalanuvchilar uchun keyingi menyuda yangi nom bilan
    ishlaydi)
  - Mini App tugmasi (Web App)
- Barcha matn/tugma/kanal sozlamalari SQLite bazasida saqlanadi — o'zgartirish
  darhol amal qiladi, botni qayta ishga tushirish shart emas

## O'rnatish

```bash
python3 -m venv venv
source venv/bin/activate        # Windowsda: venv\Scripts\activate
pip install -r requirements.txt
```

`.env.example` faylidan nusxa oling va to'ldiring:

```bash
cp .env.example .env
```

- `BOT_TOKEN` — @BotFather'dan olingan token
- `ADMIN_IDS` — admin panelga kira oladigan Telegram ID'lar (vergul bilan)
  (o'z ID'ingizni bilish uchun @userinfobot'ga yozing)
- `WEBAPP_URL` — oldin yaratilgan StarNest Mini App joylashgan **HTTPS** manzil
  (Telegram Web App faqat HTTPS bilan ishlaydi — masalan Vercel/Netlify'ga deploy qiling)

## Ishga tushirish

```bash
python bot.py
```

## Muhim eslatmalar

1. **Majburiy Telegram kanal qo'shishda** — botni albatta o'sha kanalga
   **admin** qilib qo'shing, aks holda bot obunani tekshira olmaydi.
2. **Instagram/YouTube** uchun haqiqiy tekshirish Bot API orqali imkonsiz —
   shuning uchun foydalanuvchi tugmani bosishi "tasdiqlash" sifatida qabul
   qilinadi (siz so'ragan mantiq shu).
3. **Tugma nomini o'zgartirish** darhol bazada yangilanadi, lekin foydalanuvchi
   qurilmasidagi jismoniy klaviatura faqat bot keyingi safar shu foydalanuvchiga
   menyu yuborganda (masalan qayta `/start` bosganda) yangilanadi — bu Telegram
   platformasining o'zi shunday ishlaydi, aylanma yo'l yo'q.
4. Ishlab chiqarishda (production) botni doim ishlab turishi uchun `systemd`,
   `pm2`, yoki Docker orqali fon jarayoni sifatida ishga tushirishni tavsiya
   qilamiz.

## Loyihaning tuzilishi

```
starnest_bot/
├── bot.py              # kirish nuqtasi (polling)
├── config.py            # .env dan sozlamalarni o'qish
├── database.py            # SQLite (aiosqlite) - users, settings, channels
├── force_sub.py           # majburiy obuna tekshirish logikasi
├── keyboards.py            # reply/inline klaviaturalar (dinamik)
├── states.py               # admin uchun FSM holatlari
└── handlers/
    ├── user.py              # /start, majburiy obuna, foydalanuvchi tugmalari
    └── admin.py              # admin panel: matnlar, tugmalar, obunalar
```

## Keyingi qadam

Bu bot hozircha StarNest Mini App'ni **ochish** tugmasini beradi. Buyurtma va
to'lovlarning haqiqiy amalga oshirilishi (balans, chek tasdiqlash va h.k.)
Mini App + backend tomonida ishlaydi. Ularni ulash uchun keyingi bosqichda
backend/baza arxitekturasini muhokama qilishimiz kerak bo'ladi.
