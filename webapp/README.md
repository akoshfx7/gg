# StarNest Web App (Mini App)

`StarNestApp.jsx` — foydalanuvchi paneli va admin panelni o'z ichiga olgan React
komponent (Telegram Mini App sifatida ishlash uchun mo'ljallangan demo/frontend).

## Ishlatish

Bu fayl standalone React komponent (`export default function StarNestApp()`),
quyidagi kutubxonalarga bog'liq:

- react, react-dom
- lucide-react (ikonlar)
- recharts (admin dashboarddagi grafiklar)

Haqiqiy loyihada:

1. Bu komponentni Vite/Next.js kabi React loyihasiga qo'shing
2. Kerakli paketlarni o'rnating: `npm install lucide-react recharts`
3. Build qiling va **HTTPS** manzilga deploy qiling (Vercel, Netlify va h.k.)
4. Olingan HTTPS manzilni `../bot/.env` faylidagi `WEBAPP_URL` ga yozing —
   shunda botdagi "⭐️Stars va Premium sotib olish" tugmasi shu Mini App'ni ochadi

## Eslatma

Hozirgi holatda ma'lumotlar (foydalanuvchilar, buyurtmalar, balanslar) faqat
brauzer xotirasida (mock/demo) saqlanadi — real backend/baza ulanmagan.
Bot bilan to'liq ishlashi uchun keyingi bosqichda ularni umumiy backend'ga
ulash kerak bo'ladi.
