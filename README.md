# StarNest — to'liq loyiha

Ushbu arxiv ikkita alohida qismdan iborat:

```
starnest_full/
├── bot/       — Telegram bot (Python, aiogram 3)
└── webapp/    — Mini App / Web App (React)
```

## bot/
Foydalanuvchi va admin panel logikasi, majburiy obuna tekshiruvi, matn/tugma
sozlamalari — barchasi SQLite bazasida. Ishga tushirish bo'yicha to'liq
qo'llanma: `bot/README.md`.

## webapp/
Stars/Premium sotib olish, balans to'ldirish, referal va admin dashboard —
React komponent ko'rinishida. Deploy qilish bo'yicha qo'llanma: `webapp/README.md`.

## Ikkalasini bog'lash

1. `webapp/` ni deploy qiling va HTTPS manzil oling
2. Shu manzilni `bot/.env` faylidagi `WEBAPP_URL` ga yozing
3. `bot/` ni ishga tushiring — "⭐️Stars va Premium sotib olish" tugmasi endi
   sizning Mini App'ingizni ochadi
