import React, { useState, useRef, useEffect } from "react";
import {
  Star, Gem, Wallet, Users, History, X, Check, Upload,
  LayoutDashboard, ClipboardList, CreditCard, UserCog, Trophy, Settings,
  Megaphone, Lock, Unlock, Plus, Minus, Search, ShieldAlert, Copy,
  Sparkles, Send, TrendingUp, Clock, CheckCircle2, LogOut, Eye, Image as ImageIcon,
  MessageCircle, ShieldPlus, KeyRound, Trash2
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid
} from "recharts";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const C = {
  bg: "linear-gradient(180deg, #0A0813 0%, #120D1F 100%)",
  bg2: "rgba(255,255,255,0.03)",
  surface: "rgba(255,255,255,0.045)",
  surface2: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.09)",
  gold: "#F6C56B",
  goldDeep: "#E8A33C",
  goldSoft: "#F6C56B22",
  blue: "#5FA8FF",
  blueSoft: "#5FA8FF22",
  purple: "#B3A6FF",
  purpleDeep: "#7A67F2",
  purpleSoft: "#9B8CFF22",
  text: "#F4F2FB",
  muted: "#9C96BA",
  faint: "#655E86",
  green: "#5CE79A",
  red: "#FF7A85",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');
`;

const STAR_PACKAGES = [50, 100, 300, 500, 1000];
const MIN_STARS = 50;
const PREMIUM_DURATIONS = [3, 6, 12];
const TOPUP_AMOUNTS = [1, 5, 10, 20, 50, 70, 100, 500, 1000];
const AVATAR_COLORS = [C.gold, C.blue, "#8B7CF6", "#4ADE80", "#F87171", "#38BDF8"];

const CURRENT_USER_ID = "u1";

const seedUsers = [
  { id: "u1", username: "@javokhir_dev", balance: 12.5, invited: 3, earned: 4.2, joined: "2026-06-02", blocked: false },
  { id: "u2", username: "@dilnoza_a", balance: 0, invited: 0, earned: 0, joined: "2026-07-14", blocked: false },
  { id: "u3", username: "@sardor99", balance: 45, invited: 8, earned: 11.6, joined: "2026-05-20", blocked: false },
  { id: "u4", username: "@nigora_k", balance: 3.2, invited: 1, earned: 0.8, joined: "2026-08-01", blocked: false },
];

const seedOrders = [
  { id: "ORD-1042", userId: "u1", type: "stars", amount: 100, priceUsd: 1.5, recipient: "self", status: "Bajarildi", date: "2026-08-20 11:04" },
  { id: "ORD-1043", userId: "u1", type: "premium", months: 3, priceUsd: 12, recipient: "self", status: "Kutilmoqda", date: "2026-08-24 09:41" },
  { id: "ORD-1039", userId: "u3", type: "stars", amount: 500, priceUsd: 7.5, recipient: "friend", recipientUsername: "@ali_92", status: "Bekor qilindi", date: "2026-08-15 16:22" },
  { id: "ORD-1044", userId: "u3", type: "stars", amount: 1000, priceUsd: 15, recipient: "self", status: "Kutilmoqda", date: "2026-08-25 20:10" },
];

const seedPayments = [
  { id: "PAY-501", userId: "u4", amountUsd: 10, receiptName: "chek_24_08.jpg", receiptDataUrl: "", status: "Kutilmoqda", date: "2026-08-24 12:00" },
];

const seedPricing = {
  starsPricePerUnit: 0.015,
  premiumPrices: { 3: 12, 6: 20, 12: 35 },
  minTopup: 1,
  refPercent: 5,
  cardNumber: "8600 1234 5678 9012",
  vatPercent: 2,
  rate: 13000,
};

const money = (n) => `$${Number(n).toFixed(2)}`;
const som = (n) => `${Math.round(n).toLocaleString("ru-RU")} so'm`;
const nowStr = () => {
  const d = new Date();
  const p = (x) => String(x).padStart(2, "0");
  return `2026-08-26 ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* ------------------------------------------------------------------ */
/* Small shared UI atoms                                               */
/* ------------------------------------------------------------------ */
function GlobalStyle() {
  return (
    <style>{`
      ${FONTS}
      .snx-root {
        font-family: 'Inter', sans-serif; background: ${C.bg}; background-attachment: fixed;
        color: ${C.text}; position: relative; isolation: isolate;
      }
      .snx-root::before {
        content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
        background:
          radial-gradient(600px circle at 12% 18%, rgba(155,140,255,0.22), transparent 60%),
          radial-gradient(650px circle at 88% 82%, rgba(246,197,107,0.16), transparent 60%),
          radial-gradient(550px circle at 92% 38%, rgba(95,168,255,0.12), transparent 60%);
        filter: blur(60px);
        animation: snx-drift 17s ease-in-out infinite alternate;
      }
      .snx-display { font-family: 'Sora', sans-serif; letter-spacing: -0.2px; }
      .snx-mono { font-family: 'JetBrains Mono', monospace; }
      .snx-scroll::-webkit-scrollbar { display: none; }
      .snx-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      @keyframes snx-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .snx-rise { animation: snx-rise .25s ease-out; }
      @keyframes snx-drift { from { transform: translate(0,0); } to { transform: translate(14px,-10px); } }
      @media (prefers-reduced-motion: reduce) {
        .snx-rise { animation: none !important; }
        .snx-root::before { animation: none !important; }
      }
      .snx-tab-btn:focus-visible, .snx-btn:focus-visible, .snx-input:focus-visible {
        outline: 2px solid ${C.blue}; outline-offset: 2px;
      }
      input, textarea { color: ${C.text}; }
      input::placeholder, textarea::placeholder { color: ${C.faint}; opacity: 1; }
      .snx-tab-btn, button { transition: transform .12s ease, box-shadow .12s ease; }
      button { color: ${C.text}; font-family: inherit; }
      .snx-tab-btn:active, button:active { transform: scale(.97); }
      /* Har qanday shisha-kartaga (C.surface/C.surface2 fonli) avtomatik blur effekt beradi -
         har bir komponentni alohida o'zgartirmasdan, butun ilovaga izchil "glassmorphism" beradi. */
      [style*="rgba(255,255,255,0.045)"], [style*="rgba(255,255,255,0.07)"], [style*="rgba(255,255,255,0.03)"] {
        backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
      }
    `}</style>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className="snx-rise"
      style={{
        position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
        zIndex: 300, background: C.surface2, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "10px 16px", fontSize: 13, color: C.text,
        boxShadow: "0 8px 24px rgba(0,0,0,.4)", display: "flex", alignItems: "center", gap: 8,
        maxWidth: "90vw",
      }}
    >
      <CheckCircle2 size={16} color={C.green} />
      {toast}
    </div>
  );
}

function hashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ username, size = 40, photoUrl, ring = false }) {
  const letter = (username || "?").replace("@", "").charAt(0).toUpperCase();
  const bg = hashColor(username || "?");
  const inner = photoUrl ? (
    <img
      src={photoUrl}
      alt={username || "avatar"}
      style={{
        width: size, height: size, borderRadius: "50%", objectFit: "cover",
        border: `1.5px solid ${bg}70`, flexShrink: 0, display: "block",
      }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: `${bg}26`,
      border: `1.5px solid ${bg}70`, display: "flex", alignItems: "center", justifyContent: "center",
      color: bg, fontWeight: 700, fontSize: size * 0.42, flexShrink: 0,
    }}>
      {letter}
    </div>
  );

  if (!ring) return inner;

  return (
    <div style={{
      width: size + 5, height: size + 5, borderRadius: "50%", padding: 2.5, flexShrink: 0,
      background: `conic-gradient(${C.gold}, ${C.purple}, ${C.gold})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {inner}
    </div>
  );
}

/* ================================================================== */
/* USER APP                                                            */
/* ================================================================== */
function TopHeader({ user, onLogoTap }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <button
        onClick={onLogoTap}
        aria-label="StarNest"
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: C.goldSoft, border: `1px solid ${C.gold}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={16} color={C.gold} />
        </div>
        <span className="snx-display" style={{ fontWeight: 700, fontSize: 15 }}>StarNest</span>
      </button>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <Avatar username={user.username} size={44} photoUrl={user.photoUrl} ring />
        <div style={{ textAlign: "right", lineHeight: 1.3 }}>
          <div style={{ fontSize: 10.5, color: C.muted }}>{user.username}</div>
          <div className="snx-mono" style={{ fontSize: 12.5, fontWeight: 700, color: C.gold }}>{money(user.balance)}</div>
        </div>
      </div>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="snx-tab-btn"
          style={{
            flex: 1, padding: "9px 6px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: `1px solid ${value === opt.value ? C.gold : C.border}`,
            background: value === opt.value ? C.goldSoft : "transparent",
            color: value === opt.value ? C.gold : C.muted,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function StarsTab({ pricing, addOrder, me }) {
  const [pkg, setPkg] = useState(100);
  const [custom, setCustom] = useState("");
  const [target, setTarget] = useState("self");
  const [friendUsername, setFriendUsername] = useState("");
  const selfBlocked = target === "self" && me?.hasUsername === false;

  const amount = custom ? Number(custom) || 0 : pkg;
  const belowMin = custom !== "" && amount > 0 && amount < MIN_STARS;
  const price = amount * pricing.starsPricePerUnit;
  const insufficientBalance = typeof me?.balance === "number" && price > me.balance;
  const canBuy = amount >= MIN_STARS && !selfBlocked && !insufficientBalance && (target === "self" || friendUsername.trim().startsWith("@"));

  return (
    <div className="snx-rise">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
        {STAR_PACKAGES.map((n) => (
          <button
            key={n}
            onClick={() => { setPkg(n); setCustom(""); }}
            className="snx-tab-btn"
            style={{
              padding: "12px 4px", borderRadius: 12, cursor: "pointer", textAlign: "center",
              border: `1px solid ${!custom && pkg === n ? C.gold : C.border}`,
              background: !custom && pkg === n ? C.goldSoft : C.surface, color: C.text,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Star size={13} color={C.gold} fill={C.gold} />
              <span className="snx-mono" style={{ fontWeight: 600, fontSize: 14 }}>{n}</span>
            </div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>{money(n * pricing.starsPricePerUnit)}</div>
          </button>
        ))}
      </div>
      <input
        className="snx-input"
        placeholder={`Qo'lda miqdor kiriting (min ${MIN_STARS})`}
        value={custom}
        onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
        style={{
          width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 12,
          background: C.surface, border: `1px solid ${belowMin ? C.red : C.border}`, color: C.text, fontSize: 14,
          marginBottom: belowMin ? 6 : 14,
        }}
      />
      {belowMin && (
        <div style={{ fontSize: 11.5, color: C.red, marginBottom: 14 }}>
          Minimal miqdor: {MIN_STARS} ta Stars
        </div>
      )}

      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Kimga?</div>
      <Segmented
        options={[{ value: "self", label: "O'zimga" }, { value: "friend", label: "Do'stimga" }]}
        value={target}
        onChange={setTarget}
      />
      {target === "friend" && (
        <input
          className="snx-input"
          placeholder="@username"
          value={friendUsername}
          onChange={(e) => setFriendUsername(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 12,
            background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 14,
            marginBottom: 14, marginTop: -6,
          }}
        />
      )}
      {selfBlocked && (
        <div style={{
          fontSize: 12, color: C.red, background: `${C.red}15`, border: `1px solid ${C.red}40`,
          borderRadius: 10, padding: "10px 12px", marginBottom: 14,
        }}>
          Sizda Telegram username o'rnatilmagan. Stars'ni o'zingizga yetkazib berishimiz uchun
          avval Telegram sozlamalaridan (Settings → Username) username qo'ying, so'ng qayta urinib ko'ring.
        </div>
      )}
      {!selfBlocked && insufficientBalance && (
        <div style={{
          fontSize: 12, color: C.red, background: `${C.red}15`, border: `1px solid ${C.red}40`,
          borderRadius: 10, padding: "10px 12px", marginBottom: 14,
        }}>
          Balansingizda mablag' yetarli emas ({money(me.balance)}). Avval "Balans" bo'limidan to'ldiring.
        </div>
      )}

      <BuyBar
        label={`${amount || 0} ta Stars`}
        price={price}
        disabled={!canBuy}
        onBuy={() => addOrder({
          type: "stars", amount, priceUsd: price, recipient: target,
          recipientUsername: target === "friend" ? friendUsername : undefined,
        })}
      />
    </div>
  );
}

function PremiumTab({ pricing, addOrder, me }) {
  const [months, setMonths] = useState(3);
  const [target, setTarget] = useState("self");
  const [friendUsername, setFriendUsername] = useState("");
  const price = pricing.premiumPrices[months];
  const selfBlocked = target === "self" && me?.hasUsername === false;
  const insufficientBalance = typeof me?.balance === "number" && price > me.balance;
  const canBuy = !selfBlocked && !insufficientBalance && (target === "self" || friendUsername.trim().startsWith("@"));

  return (
    <div className="snx-rise">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
        {PREMIUM_DURATIONS.map((m) => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            className="snx-tab-btn"
            style={{
              padding: "16px 4px", borderRadius: 12, cursor: "pointer", textAlign: "center",
              border: `1px solid ${months === m ? C.purple : C.border}`,
              background: months === m ? C.purpleSoft : C.surface, color: C.text,
            }}
          >
            <Gem size={16} color={C.purple} style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m} oy</div>
            <div className="snx-mono" style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>{money(pricing.premiumPrices[m])}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Kimga?</div>
      <Segmented
        options={[{ value: "self", label: "O'zimga" }, { value: "friend", label: "Do'stimga" }]}
        value={target}
        onChange={setTarget}
      />
      {target === "friend" && (
        <input
          className="snx-input"
          placeholder="@username"
          value={friendUsername}
          onChange={(e) => setFriendUsername(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 12,
            background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 14,
            marginBottom: 14, marginTop: -6,
          }}
        />
      )}
      {selfBlocked && (
        <div style={{
          fontSize: 12, color: C.red, background: `${C.red}15`, border: `1px solid ${C.red}40`,
          borderRadius: 10, padding: "10px 12px", marginBottom: 14,
        }}>
          Sizda Telegram username o'rnatilmagan. Premium'ni o'zingizga yetkazib berishimiz uchun
          avval Telegram sozlamalaridan (Settings → Username) username qo'ying, so'ng qayta urinib ko'ring.
        </div>
      )}
      {!selfBlocked && insufficientBalance && (
        <div style={{
          fontSize: 12, color: C.red, background: `${C.red}15`, border: `1px solid ${C.red}40`,
          borderRadius: 10, padding: "10px 12px", marginBottom: 14,
        }}>
          Balansingizda mablag' yetarli emas ({money(me.balance)}). Avval "Balans" bo'limidan to'ldiring.
        </div>
      )}

      <BuyBar
        label={`Premium ${months} oy`}
        price={price}
        disabled={!canBuy}
        onBuy={() => addOrder({
          type: "premium", months, priceUsd: price, recipient: target,
          recipientUsername: target === "friend" ? friendUsername : undefined,
        })}
      />
    </div>
  );
}

function BuyBar({ label, price, disabled, onBuy }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px",
    }}>
      <div>
        <div style={{ fontSize: 13, color: C.muted }}>{label}</div>
        <div className="snx-mono" style={{ fontSize: 16, fontWeight: 700 }}>{money(price || 0)}</div>
      </div>
      <button
        disabled={disabled}
        onClick={onBuy}
        className="snx-btn"
        style={{
          padding: "10px 20px", borderRadius: 12, border: "none", cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? C.surface2 : C.gold, color: disabled ? C.faint : "#1A1200",
          fontWeight: 700, fontSize: 13,
        }}
      >
        Sotib olish
      </button>
    </div>
  );
}

function BalanceTab({ pricing, user, submitPayment }) {
  const [step, setStep] = useState("pick");
  const [amount, setAmount] = useState(null);
  const [receiptName, setReceiptName] = useState("");
  const [receiptDataUrl, setReceiptDataUrl] = useState("");

  const vat = amount ? (amount * pricing.vatPercent) / 100 : 0;
  const total = amount ? amount + vat : 0;
  const totalSom = total * pricing.rate;

  const reset = () => { setStep("pick"); setAmount(null); setReceiptName(""); setReceiptDataUrl(""); };

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  if (step === "pick") {
    return (
      <div className="snx-rise">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {TOPUP_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => { setAmount(a); setStep("confirm"); }}
              className="snx-tab-btn"
              style={{
                padding: "14px 4px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                border: `1px solid ${C.border}`, background: C.surface, fontWeight: 700, fontSize: 15,
                color: C.text,
              }}
            >
              ${a}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="snx-rise">
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: C.gold, fontWeight: 600, marginBottom: 12 }}>Iltimos, ma'lumotlarni tekshiring!</div>
          <Row label="Foydalanuvchi" value={user.username} />
          <Row label="To'lov summasi" value={money(amount)} />
          <Row label="QQS" value={`${pricing.vatPercent}% (${money(vat)})`} />
          <Row label="Kurs" value={`1$ = ${pricing.rate.toLocaleString("ru-RU")} so'm`} />
          <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
          <Row label="Umumiy to'lanadi" value={`${money(total)} · ${som(totalSom)}`} bold />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SecondaryBtn onClick={reset}>Bekor qilish</SecondaryBtn>
          <PrimaryBtn onClick={() => setStep("card")}>To'lash</PrimaryBtn>
        </div>
      </div>
    );
  }

  if (step === "card") {
    return (
      <div className="snx-rise">
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 14, textAlign: "center" }}>
          <CreditCard size={22} color={C.blue} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Quyidagi kartaga o'tkazing</div>
          <div className="snx-mono" style={{ fontSize: 19, letterSpacing: 1.5, fontWeight: 600 }}>{pricing.cardNumber}</div>
          <div className="snx-mono" style={{ fontSize: 15, color: C.gold, marginTop: 8 }}>{money(total)} · {som(totalSom)}</div>
        </div>
        <PrimaryBtn onClick={() => setStep("upload")}>To'ladim</PrimaryBtn>
      </div>
    );
  }

  if (step === "upload") {
    return (
      <div className="snx-rise">
        <label
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8, border: `1.5px dashed ${C.border}`, borderRadius: 16, padding: 22, cursor: "pointer",
            marginBottom: 14, background: C.surface, overflow: "hidden",
          }}
        >
          {receiptDataUrl ? (
            <img src={receiptDataUrl} alt="chek" style={{ maxHeight: 140, borderRadius: 10 }} />
          ) : (
            <Upload size={22} color={C.muted} />
          )}
          <span style={{ fontSize: 13, color: C.muted }}>{receiptName ? receiptName : "To'lov chekini yuklang"}</span>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
        </label>
        <PrimaryBtn
          disabled={!receiptName}
          onClick={() => { submitPayment({ amountUsd: amount, receiptName, receiptDataUrl }); setStep("pending"); }}
        >
          Chekni yuborish
        </PrimaryBtn>
      </div>
    );
  }

  return (
    <div className="snx-rise" style={{ textAlign: "center", padding: "30px 10px" }}>
      <Clock size={30} color={C.gold} style={{ marginBottom: 12 }} />
      <div style={{ fontWeight: 600, marginBottom: 6 }}>To'lovingiz tekshirilmoqda</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
        Admin chekni ko'rib chiqqach, balansingiz avtomatik to'ldiriladi.
      </div>
      <SecondaryBtn onClick={reset}>Ortga</SecondaryBtn>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span className="snx-mono" style={{ color: C.text, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="snx-btn"
      style={{
        flex: 1, padding: "12px 16px", borderRadius: 12, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? C.surface2 : `linear-gradient(135deg, ${C.gold}, ${C.goldDeep})`,
        color: disabled ? C.faint : "#1A1200",
        fontWeight: 700, fontSize: 14, width: "100%",
        boxShadow: disabled ? "none" : `0 6px 20px ${C.gold}33`,
      }}
    >
      {children}
    </button>
  );
}
function SecondaryBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="snx-btn"
      style={{
        flex: 1, padding: "12px 16px", borderRadius: 12, cursor: "pointer",
        background: "transparent", border: `1px solid ${C.border}`, color: C.muted,
        fontWeight: 600, fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function ReferralTab({ user, showToast, referralLink }) {
  const link = referralLink || `https://t.me/Star_NestBot?start=ref_${user.id}`;
  return (
    <div className="snx-rise">
      <div style={{
        background: `linear-gradient(135deg, ${C.blueSoft}, transparent)`, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: 18, marginBottom: 14,
      }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Shaxsiy taklif havolangiz</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="snx-mono" style={{ fontSize: 12, color: C.blue, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {link}
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(link); showToast("Havola nusxalandi"); }}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Copy size={15} color={C.muted} />
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <StatBox icon={<Users size={16} color={C.blue} />} label="Taklif qilingan" value={user.invited} />
        <StatBox icon={<TrendingUp size={16} color={C.green} />} label="Ishlangan" value={money(user.earned)} />
      </div>
    </div>
  );
}
function StatBox({ icon, label, value }) {
  return (
    <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
      {icon}
      <div className="snx-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const STATUS_COLOR = { Kutilmoqda: C.gold, Bajarildi: C.green, "Bekor qilindi": C.red };

function HistoryTab({ orders }) {
  if (!orders.length) {
    return <div style={{ textAlign: "center", color: C.muted, padding: "30px 0", fontSize: 13 }}>Buyurtmalar yo'q</div>;
  }
  return (
    <div className="snx-rise" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {orders.map((o) => (
        <div key={o.id} style={{
          display: "flex", alignItems: "center", gap: 10, background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: o.type === "stars" ? C.goldSoft : C.purpleSoft,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {o.type === "stars" ? <Star size={15} color={C.gold} /> : <Gem size={15} color={C.purple} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {o.type === "stars" ? `${o.amount} Stars` : `Premium ${o.months} oy`}
            </div>
            <div style={{ fontSize: 11, color: C.faint }}>{o.id} · {o.date}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="snx-mono" style={{ fontSize: 13, fontWeight: 600 }}>{money(o.priceUsd)}</div>
            <div style={{ fontSize: 10.5, color: STATUS_COLOR[o.status], fontWeight: 600 }}>{o.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "stars", label: "Stars", icon: Star },
    { id: "premium", label: "Premium", icon: Gem },
    { id: "balance", label: "Balans", icon: Wallet },
    { id: "referral", label: "Referal", icon: Users },
    { id: "history", label: "Tarix", icon: History },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, background: C.bg2,
      borderTop: `1px solid ${C.border}`, zIndex: 60,
    }}>
      <div style={{
        maxWidth: 420, margin: "0 auto", display: "flex", justifyContent: "space-around",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="snx-tab-btn"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer", padding: "5px 10px",
              color: tab === t.id ? C.gold : C.faint, minWidth: 54,
            }}
          >
            <t.icon size={19} fill={tab === t.id && t.id === "stars" ? C.gold : "none"} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockedScreen({ user, onLogoTap }) {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", padding: "18px 16px" }}>
      <TopHeader user={user} onLogoTap={onLogoTap} />
      <div style={{
        marginTop: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: `${C.red}1c`, border: `1px solid ${C.red}55`,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <ShieldAlert size={26} color={C.red} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Hisobingiz bloklangan</div>
        <div style={{ fontSize: 13, color: C.muted, maxWidth: 280 }}>
          Web ilovadan foydalanish vaqtincha to'xtatilgan. Savol bo'lsa, admin bilan bog'laning.
        </div>
      </div>
    </div>
  );
}

function UserApp({ users, orders, addOrder, addPayment, onLogoTap, pricing, showToast, referralLink }) {
  const [tab, setTab] = useState("stars");
  const user = users.find((u) => u.id === CURRENT_USER_ID);
  const myOrders = orders.filter((o) => o.userId === CURRENT_USER_ID).slice().reverse();

  if (user.blocked) return <BlockedScreen user={user} onLogoTap={onLogoTap} />;

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: "transparent",
      padding: "18px 16px 96px", position: "relative",
    }}>
      <TopHeader user={user} onLogoTap={onLogoTap} />

      {tab === "stars" && <StarsTab pricing={pricing} addOrder={addOrder} me={user} />}
      {tab === "premium" && <PremiumTab pricing={pricing} addOrder={addOrder} me={user} />}
      {tab === "balance" && <BalanceTab pricing={pricing} user={user} submitPayment={addPayment} />}
      {tab === "referral" && <ReferralTab user={user} showToast={showToast} referralLink={referralLink} />}
      {tab === "history" && <HistoryTab orders={myOrders} />}

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

/* ================================================================== */
/* ADMIN LOGIN                                                         */
/* ================================================================== */
const API_URL = import.meta.env.VITE_API_URL || "";

function AdminLoginModal({ onClose, onSuccess }) {
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setErr("");
    if (!API_URL) {
      setErr("Server manzili sozlanmagan (VITE_API_URL)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onSuccess(data.token);
      } else {
        setErr(data.error || "Login yoki parol noto'g'ri");
      }
    } catch (e) {
      setErr("Serverga ulanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(5,7,14,.7)", zIndex: 150,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="snx-rise" style={{
        width: "100%", maxWidth: 340, background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 18, padding: 22, position: "relative",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer" }}>
          <X size={16} color={C.muted} />
        </button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <Lock size={19} color={C.gold} />
          </div>
          <div className="snx-display" style={{ fontWeight: 700, fontSize: 16 }}>Admin panelga kirish</div>
        </div>
        <input
          className="snx-input" placeholder="Login" value={login} onChange={(e) => setLogin(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, background: C.surface2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, marginBottom: 10 }}
        />
        <input
          className="snx-input" placeholder="Parol" type="password" value={pass} onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, background: C.surface2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, marginBottom: 10 }}
        />
        {err && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{err}</div>}
        <PrimaryBtn onClick={submit} disabled={loading}>{loading ? "Tekshirilmoqda..." : "Kirish"}</PrimaryBtn>
      </div>
    </div>
  );
}

/* ================================================================== */
/* ADMIN PANEL                                                         */
/* ================================================================== */
function AdminSidebar({ section, setSection, onLogout }) {
  const items = [
    { id: "dashboard", label: "Boshqaruv paneli", icon: LayoutDashboard },
    { id: "orders", label: "Buyurtmalar", icon: ClipboardList },
    { id: "payments", label: "To'lov so'rovlari", icon: CreditCard },
    { id: "users", label: "Foydalanuvchilar", icon: UserCog },
    { id: "referrals", label: "Referrallar", icon: Trophy },
    { id: "pricing", label: "Narxlar / sozlamalar", icon: Settings },
    { id: "broadcast", label: "Xabar yuborish", icon: Megaphone },
    { id: "admins", label: "Adminlar", icon: ShieldPlus },
  ];
  return (
    <div style={{
      width: 232, flexShrink: 0, background: C.bg2, borderRight: `1px solid ${C.border}`,
      padding: "20px 12px", display: "flex", flexDirection: "column", minHeight: "100vh",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", marginBottom: 24 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={15} color={C.gold} />
        </div>
        <span className="snx-display" style={{ fontWeight: 700, fontSize: 15 }}>StarNest <span style={{ color: C.faint, fontWeight: 500 }}>Admin</span></span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setSection(it.id)}
            className="snx-tab-btn"
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10,
              cursor: "pointer", fontSize: 13, textAlign: "left", border: "none",
              background: section === it.id ? C.surface : "transparent",
              color: section === it.id ? C.text : C.muted, fontWeight: section === it.id ? 600 : 500,
            }}
          >
            <it.icon size={15} color={section === it.id ? C.gold : C.faint} /> {it.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button
        onClick={onLogout}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10,
          cursor: "pointer", fontSize: 13, background: "transparent", border: "none", color: C.muted,
        }}
      >
        <LogOut size={15} /> Chiqish
      </button>
    </div>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      </div>
      <div className="snx-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{value}</div>
    </div>
  );
}

function DashboardSection({ users, orders, paymentRequests }) {
  const totalSales = orders.filter((o) => o.status === "Bajarildi").reduce((s, o) => s + o.priceUsd, 0);
  const pendingOrders = orders.filter((o) => o.status === "Kutilmoqda").length;
  const pendingPayments = paymentRequests.filter((p) => p.status === "Kutilmoqda").length;

  const salesByDay = [
    { day: "Se", sum: 42 }, { day: "Ya", sum: 65 }, { day: "Se", sum: 38 },
    { day: "Ch", sum: 90 }, { day: "Pa", sum: 54 }, { day: "Sh", sum: 110 }, { day: "Ya", sum: 76 },
  ];
  const statusData = [
    { name: "Bajarildi", value: orders.filter((o) => o.status === "Bajarildi").length, color: C.green },
    { name: "Kutilmoqda", value: orders.filter((o) => o.status === "Kutilmoqda").length, color: C.gold },
    { name: "Bekor qilindi", value: orders.filter((o) => o.status === "Bekor qilindi").length, color: C.red },
  ];

  return (
    <div className="snx-rise">
      <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <StatCard label="Jami foydalanuvchilar" value={users.length} icon={<Users size={15} color={C.blue} />} accent={C.blue} />
        <StatCard label="Jami savdo" value={money(totalSales)} icon={<TrendingUp size={15} color={C.green} />} accent={C.green} />
        <StatCard label="Kutilayotgan buyurtmalar" value={pendingOrders} icon={<ClipboardList size={15} color={C.gold} />} accent={C.gold} />
        <StatCard label="Kutilayotgan to'lovlar" value={pendingPayments} icon={<CreditCard size={15} color={C.red} />} accent={C.red} />
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 320, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, height: 260 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Haftalik savdo ($)</div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="day" stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="sum" fill={C.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 220, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, height: 260 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Buyurtmalar holati</div>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, color, title }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 30, height: 30, borderRadius: 8, border: `1px solid ${color}55`, background: `${color}18`,
      color, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
    }}>{children}</button>
  );
}

function OrdersSection({ orders, onApprove, onReject, loading }) {
  const [filter, setFilter] = useState("Kutilmoqda");
  const filtered = filter === "Barchasi" ? orders : orders.filter((o) => o.status === filter);
  const GRID = "150px minmax(150px,1.6fr) 90px 150px 150px";

  return (
    <div className="snx-rise">
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["Barchasi", "Kutilmoqda", "Bajarildi", "Bekor qilindi"].map((f) => (
          <button
            key={f} onClick={() => setFilter(f)}
            style={{
              padding: "7px 14px", borderRadius: 9, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
              border: `1px solid ${filter === f ? C.gold : C.border}`,
              background: filter === f ? C.goldSoft : "transparent", color: filter === f ? C.gold : C.muted,
            }}
          >{f}</button>
        ))}
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, padding: "10px 16px", borderBottom: `1px solid ${C.border}`, minWidth: 700 }}>
          {["Buyurtma", "Xaridor", "Narx", "Sana / vaqt", "Holat / Amallar"].map((h) => (
            <span key={h} style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: "uppercase", letterSpacing: .4 }}>{h}</span>
          ))}
        </div>
        {loading && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Yuklanmoqda...</div>}
        {!loading && filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Buyurtmalar yo'q</div>}
        {!loading && filtered.map((o, i) => (
          <div key={o.id} style={{
            display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "12px 16px",
            borderTop: i ? `1px solid ${C.border}` : "none", minWidth: 700,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, background: o.type === "stars" ? C.goldSoft : C.purpleSoft,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {o.type === "stars" ? <Star size={13} color={C.gold} /> : <Gem size={13} color={C.purple} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.summary}</div>
                <div className="snx-mono" style={{ fontSize: 10.5, color: C.faint }}>{o.id}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{o.buyerUsername}</div>
            <div className="snx-mono" style={{ fontSize: 13, fontWeight: 700 }}>{money(o.amountUsd)}</div>
            <div style={{ fontSize: 11.5, color: C.muted }}>{(o.createdAt || "").replace("T", " ").slice(0, 16)}</div>
            {o.status === "Kutilmoqda" ? (
              <div style={{ display: "flex", gap: 6 }}>
                <IconBtn title="Tasdiqlash" onClick={() => onApprove(o)} color={C.green}><Check size={14} /></IconBtn>
                <IconBtn title="Bekor qilish (mablag' qaytadi)" onClick={() => onReject(o)} color={C.red}><X size={14} /></IconBtn>
              </div>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[o.status] }}>{o.status}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReceiptModal({ payment, buyer, onClose, onApprove, onReject, onBlock }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(5,7,14,.75)", zIndex: 160,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="snx-rise" style={{
        width: "100%", maxWidth: 420, background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 18, padding: 20, position: "relative",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer" }}>
          <X size={16} color={C.muted} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Avatar username={buyer?.username || "?"} size={36} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{buyer?.username}</div>
            <div style={{ fontSize: 11.5, color: C.faint }}>{payment.id} · {payment.date}</div>
          </div>
        </div>

        <div style={{
          background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12,
          minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, overflow: "hidden",
        }}>
          {payment.receiptDataUrl ? (
            <img src={payment.receiptDataUrl} alt="chek" style={{ maxWidth: "100%", maxHeight: 320, display: "block" }} />
          ) : (
            <div style={{ textAlign: "center", color: C.faint, padding: 30 }}>
              <ImageIcon size={26} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 12 }}>Chek rasmi mavjud emas (eski demo yozuv)</div>
            </div>
          )}
        </div>

        <Row label="To'lov summasi" value={money(payment.amountUsd)} bold />

        {payment.status === "Kutilmoqda" ? (
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => onBlock(payment)} title="Bloklash" style={{
              width: 44, borderRadius: 12, border: `1px solid ${C.red}55`, background: `${C.red}18`,
              color: C.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}><ShieldAlert size={16} /></button>
            <SecondaryBtn onClick={() => onReject(payment)}>Rad etish</SecondaryBtn>
            <PrimaryBtn onClick={() => onApprove(payment)}>Tasdiqlash</PrimaryBtn>
          </div>
        ) : (
          <div style={{ marginTop: 14, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: STATUS_COLOR[payment.status] || C.muted }}>
            {payment.status}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentsSection({ adminToken, showToast }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  const load = () => {
    if (!API_URL || !adminToken) return;
    setLoading(true);
    fetch(`${API_URL}/api/admin/payments`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPayments(d.requests); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [adminToken]);

  const act = async (p, action, successMsg) => {
    const res = await fetch(`${API_URL}/api/admin/payments/${p.id}/${action}`, {
      method: "POST", headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.ok && data.ok) { showToast(successMsg); load(); }
    else showToast(data.error || "Xatolik");
    setViewing(null);
  };

  const approve = (p) => act(p, "approve", `${p.id} tasdiqlandi — balans ${money(p.amountUsd)}ga oshirildi`);
  const reject = (p) => act(p, "reject", `${p.id} rad etildi`);
  const block = (p) => act(p, "block", `${p.buyerUsername} bloklandi`);

  return (
    <div className="snx-rise" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {loading && <div style={{ color: C.muted, fontSize: 13 }}>Yuklanmoqda...</div>}
      {!loading && payments.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>To'lov so'rovlari yo'q</div>}
      {!loading && payments.map((p) => (
        <button
          key={p.id}
          onClick={() => setViewing(p)}
          style={{
            display: "flex", alignItems: "center", gap: 14, background: C.surface, textAlign: "left",
            border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, cursor: "pointer", width: "100%",
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 10, background: C.surface2, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden",
          }}>
            {p.receiptDataUrl ? (
              <img src={p.receiptDataUrl} alt="chek" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <ImageIcon size={18} color={C.faint} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.buyerUsername} · {money(p.amountUsd)}</div>
            <div style={{ fontSize: 11.5, color: C.faint }}>{p.id} · {(p.createdAt || "").replace("T", " ").slice(0, 16)}</div>
          </div>
          {p.status === "Kutilmoqda" ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.gold, fontWeight: 600 }}>
              <Eye size={14} /> Chekni ko'rish
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[p.status] || C.muted }}>{p.status}</span>
          )}
        </button>
      ))}

      {viewing && (
        <ReceiptModal
          payment={viewing}
          buyer={{ username: viewing.buyerUsername }}
          onClose={() => setViewing(null)}
          onApprove={approve}
          onReject={reject}
          onBlock={block}
        />
      )}
    </div>
  );
}

function UsersSection({ users, onAdjustBalance, onToggleBlock, onSendMessage }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [amt, setAmt] = useState("");
  const [messaging, setMessaging] = useState(null);
  const [msgText, setMsgText] = useState("");

  const filtered = users.filter((u) => u.username.toLowerCase().includes(q.toLowerCase()) || u.id.includes(q));

  const applyBalance = (u) => {
    const val = Number(amt) || 0;
    if (!val) return;
    const delta = editing.mode === "add" ? val : -val;
    onAdjustBalance(u, delta);
    setEditing(null); setAmt("");
  };

  const sendMessage = (u) => {
    if (!msgText.trim()) return;
    onSendMessage(u, msgText.trim());
    setMessaging(null); setMsgText("");
  };

  const GRID = "36px minmax(140px,1fr) 90px 138px";

  return (
    <div className="snx-rise">
      <div style={{ position: "relative", marginBottom: 14, maxWidth: 320 }}>
        <Search size={14} color={C.faint} style={{ position: "absolute", left: 12, top: 11 }} />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID yoki username qidirish"
          style={{
            width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 32px", borderRadius: 10,
            background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 13,
          }}
        />
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Foydalanuvchilar yo'q</div>}
        {filtered.map((u, i) => (
          <div key={u.id}>
            <div style={{
              display: "grid", gridTemplateColumns: GRID, gap: 12, alignItems: "center", padding: "12px 16px",
              borderTop: i ? `1px solid ${C.border}` : "none", opacity: u.blocked ? 0.55 : 1,
            }}>
              <Avatar username={u.username} size={34} photoUrl={u.photoUrl} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  {u.username}
                  {u.blocked && <span style={{
                    fontSize: 9.5, fontWeight: 700, color: C.red, background: `${C.red}1c`,
                    border: `1px solid ${C.red}55`, borderRadius: 6, padding: "1px 6px",
                  }}>BLOKLANGAN</span>}
                </div>
                <div style={{ fontSize: 11, color: C.faint }}>{u.id} · qo'shildi {u.joined}</div>
              </div>
              <div className="snx-mono" style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>{money(u.balance)}</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <IconBtn title="Balans qo'shish" onClick={() => setEditing({ id: u.id, mode: "add" })} color={C.green}><Plus size={14} /></IconBtn>
                <IconBtn title="Balans ayirish" onClick={() => setEditing({ id: u.id, mode: "sub" })} color={C.gold}><Minus size={14} /></IconBtn>
                <IconBtn title="Xabar yuborish" onClick={() => setMessaging(u.id)} color={C.blue}><MessageCircle size={14} /></IconBtn>
                <IconBtn
                  title={u.blocked ? "Blokdan chiqarish" : "Bloklash"}
                  onClick={() => onToggleBlock(u)}
                  color={u.blocked ? C.blue : C.red}
                >
                  {u.blocked ? <Unlock size={14} /> : <Lock size={14} />}
                </IconBtn>
              </div>
            </div>
            {editing?.id === u.id && (
              <div style={{ display: "flex", gap: 8, padding: "10px 16px 14px", background: C.bg2, flexWrap: "wrap" }}>
                <input placeholder="Summa" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
                  style={{ width: 90, padding: "8px 10px", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 12.5 }} />
                <button onClick={() => applyBalance(u)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: C.gold, color: "#1A1200", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Qo'llash</button>
                <button onClick={() => setEditing(null)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12.5, cursor: "pointer" }}>Bekor</button>
              </div>
            )}
            {messaging === u.id && (
              <div style={{ display: "flex", gap: 8, padding: "10px 16px 14px", background: C.bg2, flexWrap: "wrap" }}>
                <input placeholder={`Faqat ${u.username}ga boradigan xabar`} value={msgText} onChange={(e) => setMsgText(e.target.value)}
                  style={{ flex: 1, minWidth: 180, padding: "8px 10px", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 12.5 }} />
                <button onClick={() => sendMessage(u)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: C.blue, color: "#0A1730", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Yuborish</button>
                <button onClick={() => { setMessaging(null); setMsgText(""); }} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12.5, cursor: "pointer" }}>Bekor</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferralsSection({ users }) {
  const ranked = users.slice().sort((a, b) => b.earned - a.earned);
  return (
    <div className="snx-rise" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      {ranked.map((u, i) => (
        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i ? `1px solid ${C.border}` : "none" }}>
          <div className="snx-mono" style={{
            width: 26, height: 26, borderRadius: 8, background: i === 0 ? C.goldSoft : C.surface2,
            color: i === 0 ? C.gold : C.faint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
          }}>{i + 1}</div>
          <Avatar username={u.username} size={30} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{u.username}</div>
            <div style={{ fontSize: 11.5, color: C.faint }}>{u.invited} ta taklif</div>
          </div>
          <div className="snx-mono" style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{money(u.earned)}</div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, prefix }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 12px" }}>
        {prefix && <span style={{ color: C.faint, fontSize: 13, marginRight: 4 }}>{prefix}</span>}
        <input value={value} onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, padding: "9px 0", fontSize: 13 }} />
      </div>
    </div>
  );
}

function PricingSection({ pricing, setPricing, showToast, adminToken }) {
  const [form, setForm] = useState(pricing);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setPremium = (m, v) => setForm((f) => ({ ...f, premiumPrices: { ...f.premiumPrices, [m]: v } }));

  const save = async () => {
    setPricing(form);
    if (!API_URL || !adminToken) { showToast("Sozlamalar saqlandi"); return; }
    const res = await fetch(`${API_URL}/api/admin/pricing`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        starsPricePerUnit: form.starsPricePerUnit,
        premiumPrice3: form.premiumPrices[3],
        premiumPrice6: form.premiumPrices[6],
        premiumPrice12: form.premiumPrices[12],
        cardNumber: form.cardNumber,
      }),
    });
    const data = await res.json();
    showToast(res.ok && data.ok ? "Sozlamalar saqlandi va botga qo'llandi" : (data.error || "Saqlanmadi"));
  };

  return (
    <div className="snx-rise" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Stars va Premium narxi</div>
        <Field label="1 ta Star narxi ($)" value={form.starsPricePerUnit} onChange={(v) => set("starsPricePerUnit", v)} />
        {PREMIUM_DURATIONS.map((m) => (
          <Field key={m} label={`Premium ${m} oy ($)`} value={form.premiumPrices[m]} onChange={(v) => setPremium(m, v)} />
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>To'lov sozlamalari</div>
        <Field label="Minimal to'ldirish summasi ($)" value={form.minTopup} onChange={(v) => set("minTopup", v)} />
        <Field label="Referal foizi (%)" value={form.refPercent} onChange={(v) => set("refPercent", v)} />
        <Field label="QQS (%)" value={form.vatPercent} onChange={(v) => set("vatPercent", v)} />
        <Field label="Kurs (1$ = necha so'm)" value={form.rate} onChange={(v) => set("rate", v)} />
        <Field label="Karta raqami" value={form.cardNumber} onChange={(v) => set("cardNumber", v)} />
        <div style={{ marginTop: 14 }}>
          <PrimaryBtn onClick={save}>💾 Saqlash</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

function BroadcastSection({ adminToken, showToast }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim() || !API_URL) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(`Bot orqali ${data.sent} foydalanuvchiga yuborildi${data.failed ? `, ${data.failed} tasiga yetmadi` : ""}`);
        setText("");
      } else {
        showToast(data.error || "Yuborilmadi");
      }
    } catch {
      showToast("Serverga ulanib bo'lmadi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="snx-rise" style={{ maxWidth: 480 }}>
      <div style={{ fontSize: 12, color: C.faint, marginBottom: 10 }}>
        Bu xabar Web App orqali emas — to'g'ridan-to'g'ri bot orqali, Telegram xabari sifatida
        barcha ro'yxatdan o'tgan foydalanuvchilarga yuboriladi.
      </div>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} placeholder="Xabar matnini yozing..."
        rows={6}
        style={{
          width: "100%", boxSizing: "border-box", padding: 14, borderRadius: 12, background: C.surface,
          border: `1px solid ${C.border}`, color: C.text, fontSize: 13, resize: "vertical", marginBottom: 12,
          fontFamily: "inherit",
        }}
      />
      <PrimaryBtn disabled={!text.trim() || sending} onClick={send}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
          <Send size={14} /> {sending ? "Yuborilmoqda..." : "Barchaga yuborish"}
        </span>
      </PrimaryBtn>
    </div>
  );
}

function AdminsSection({ adminToken, showToast }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLogin, setNewLogin] = useState("");
  const [newPass, setNewPass] = useState("");

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/admins`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setAdmins(d.admins); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (API_URL && adminToken) load(); }, [adminToken]);

  const addAdmin = async () => {
    if (!newLogin.trim() || newPass.length < 4) {
      showToast("Login va parol (kamida 4 belgi) kiriting");
      return;
    }
    const res = await fetch(`${API_URL}/api/admin/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ login: newLogin.trim(), password: newPass }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      showToast("Yangi admin qo'shildi");
      setNewLogin(""); setNewPass("");
      load();
    } else {
      showToast(data.error || "Qo'shilmadi");
    }
  };

  const removeAdmin = async (login) => {
    const res = await fetch(`${API_URL}/api/admin/admins/${encodeURIComponent(login)}/remove`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      showToast(`${login} adminlikdan olib tashlandi — login/paroli o'chirildi`);
      load();
    } else {
      showToast(data.error || "O'chirilmadi");
    }
  };

  return (
    <div className="snx-rise">
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 16, maxWidth: 420 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Yangi admin qo'shish</div>
        <Field label="Login" value={newLogin} onChange={setNewLogin} />
        <Field label="Parol" value={newPass} onChange={setNewPass} />
        <div style={{ marginTop: 10 }}>
          <PrimaryBtn onClick={addAdmin}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <ShieldPlus size={14} /> Qo'shish
            </span>
          </PrimaryBtn>
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", maxWidth: 420 }}>
        {loading && <div style={{ padding: 20, textAlign: "center", color: C.muted, fontSize: 13 }}>Yuklanmoqda...</div>}
        {!loading && admins.map((a, i) => (
          <div key={a.login} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px",
            borderTop: i ? `1px solid ${C.border}` : "none",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <KeyRound size={13} color={C.gold} /> {a.login}
                {a.is_owner ? <span style={{ fontSize: 9.5, color: C.gold, fontWeight: 700 }}>BOSH ADMIN</span> : null}
              </div>
              <div style={{ fontSize: 11, color: C.faint }}>{(a.created_at || "").slice(0, 10)}</div>
            </div>
            {!a.is_owner && (
              <IconBtn title="O'chirish" onClick={() => removeAdmin(a.login)} color={C.red}><Trash2 size={14} /></IconBtn>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPanel({ pricing, setPricing, showToast, onExit, adminToken }) {
  const [section, setSection] = useState("dashboard");
  const [orders, setOrdersState] = useState([]);
  const [users, setUsersState] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const titles = {
    dashboard: "Boshqaruv paneli", orders: "Buyurtmalar", payments: "To'lov so'rovlari",
    users: "Foydalanuvchilar", referrals: "Referrallar reytingi", pricing: "Narxlar / sozlamalar",
    broadcast: "Xabar yuborish", admins: "Adminlar",
  };

  const loadPaymentsCount = () => {
    if (!API_URL || !adminToken) return;
    fetch(`${API_URL}/api/admin/payments`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPendingPayments(d.requests.filter((p) => p.status === "Kutilmoqda")); })
      .catch(() => {});
  };

  const loadOrders = () => {
    if (!API_URL || !adminToken) return;
    setLoadingOrders(true);
    fetch(`${API_URL}/api/admin/orders`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setOrdersState(d.orders); })
      .finally(() => setLoadingOrders(false));
  };
  const loadUsers = () => {
    if (!API_URL || !adminToken) return;
    setLoadingUsers(true);
    fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setUsersState(d.users); })
      .finally(() => setLoadingUsers(false));
  };
  useEffect(() => { loadOrders(); loadUsers(); loadPaymentsCount(); }, [adminToken]);

  const handleApprove = async (order) => {
    const res = await fetch(`${API_URL}/api/admin/orders/${order.id}/approve`, {
      method: "POST", headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.ok && data.ok) { showToast(`${order.id} tasdiqlandi — foydalanuvchiga xabar yuborildi`); loadOrders(); }
    else showToast(data.error || "Xatolik");
  };
  const handleReject = async (order) => {
    const res = await fetch(`${API_URL}/api/admin/orders/${order.id}/cancel`, {
      method: "POST", headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.ok && data.ok) { showToast(`${order.id} bekor qilindi — mablag' qaytarildi`); loadOrders(); loadUsers(); }
    else showToast(data.error || "Xatolik");
  };
  const handleAdjustBalance = async (u, delta) => {
    const res = await fetch(`${API_URL}/api/admin/users/${u.telegramId}/adjust-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta }),
    });
    const data = await res.json();
    if (res.ok && data.ok) { showToast(`${u.username} balansi ${delta > 0 ? "+" : ""}${delta}$`); loadUsers(); }
    else showToast(data.error || "Xatolik");
  };
  const handleToggleBlock = async (u) => {
    const res = await fetch(`${API_URL}/api/admin/users/${u.telegramId}/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ blocked: !u.blocked }),
    });
    const data = await res.json();
    if (res.ok && data.ok) { showToast(u.blocked ? `${u.username} blokdan chiqarildi` : `${u.username} bloklandi`); loadUsers(); }
    else showToast(data.error || "Xatolik");
  };
  const handleSendMessage = async (u, text) => {
    const res = await fetch(`${API_URL}/api/admin/users/${u.telegramId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (res.ok && data.ok) showToast(`Xabar faqat ${u.username}ga yuborildi`);
    else showToast(data.error || "Yuborilmadi");
  };

  // Admin panel ochiq turgan vaqtda serverga "men shu yerdaman" signali yuboriladi.
  // Shu tufayli yangi buyurtma kelganda, admin panel ichida bo'lsa, botdan
  // qo'shimcha bildirishnoma kelmaydi - admin buyurtmani baribir shu yerda ko'radi.
  useEffect(() => {
    if (!API_URL || !adminToken) return;
    const ping = () => {
      fetch(`${API_URL}/api/admin/heartbeat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 20000);
    return () => {
      clearInterval(interval);
      fetch(`${API_URL}/api/admin/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        keepalive: true,
      }).catch(() => {});
    };
  }, [adminToken]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "transparent" }}>
      <AdminSidebar section={section} setSection={setSection} onLogout={onExit} />
      <div style={{ flex: 1, padding: "24px 28px", overflowX: "hidden" }}>
        <div className="snx-display" style={{ fontSize: 19, fontWeight: 700, marginBottom: 18 }}>{titles[section]}</div>
        {section === "dashboard" && <DashboardSection users={users} orders={orders} paymentRequests={pendingPayments} />}
        {section === "orders" && <OrdersSection orders={orders} onApprove={handleApprove} onReject={handleReject} loading={loadingOrders} />}
        {section === "payments" && <PaymentsSection adminToken={adminToken} showToast={showToast} />}
        {section === "users" && <UsersSection users={users} onAdjustBalance={handleAdjustBalance} onToggleBlock={handleToggleBlock} onSendMessage={handleSendMessage} />}
        {section === "referrals" && <ReferralsSection users={users} />}
        {section === "pricing" && <PricingSection pricing={pricing} setPricing={setPricing} showToast={showToast} adminToken={adminToken} />}
        {section === "broadcast" && <BroadcastSection adminToken={adminToken} showToast={showToast} />}
        {section === "admins" && <AdminsSection adminToken={adminToken} showToast={showToast} />}
      </div>
    </div>
  );
}

/* ================================================================== */
/* ROOT                                                                 */
/* ================================================================== */
export default function StarNestApp() {
  const [users, setUsers] = useState(seedUsers);
  const [orders, setOrders] = useState(seedOrders);
  const [paymentRequests, setPaymentRequests] = useState(seedPayments);
  const [pricing, setPricing] = useState(seedPricing);
  const [view, setView] = useState("user");
  const [showLogin, setShowLogin] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [referralLink, setReferralLink] = useState(null);
  const [backendReady, setBackendReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState("boot");

  // Telegram Mini App ochilganda: Telegram'ning o'zi tomonidan imzolangan
  // initData'ni backend'ga yuboramiz. Backend uni tekshirib, HAQIQIY
  // foydalanuvchini (balans, referal, buyurtmalar tarixi bilan) SQLite'da
  // saqlab qo'yadi - shu tufayli 1 yildan keyin ham qaytib kirsa, hammasi
  // saqlanib turadi (mock/vaqtinchalik emas).
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) { setDebugInfo("tg:YO'Q"); return; }
    tg.ready?.();
    tg.expand?.();

    const initLen = (tg.initData || "").length;
    setDebugInfo(`tg:bor initData_len:${initLen} API_URL:${API_URL || "BO'SH"}`);

    if (!API_URL || !tg.initData) return;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initData: tg.initData,
            startParam: tg.initDataUnsafe?.start_param,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) return;

        setUserToken(data.token);
        setReferralLink(data.referralLink);
        setUsers((prev) => prev.map((u) => (u.id === CURRENT_USER_ID ? { ...u, ...data.user, id: CURRENT_USER_ID } : u)));

        const pr = await fetch(`${API_URL}/api/pricing`).then((r) => r.json()).catch(() => null);
        if (pr?.ok) {
          setPricing({
            starsPricePerUnit: pr.starsPricePerUnit,
            premiumPrices: { 3: pr.premiumPrices["3"], 6: pr.premiumPrices["6"], 12: pr.premiumPrices["12"] },
            cardNumber: pr.cardNumber,
          });
        }
        setBackendReady(true);
      } catch {
        // Backend'ga yetib bo'lmasa, mock ma'lumot bilan davom etamiz (masalan lokal test paytida).
      }
    })();
  }, []);
  const [adminToken, setAdminToken] = useState(null);
  const [toast, setToast] = useState(null);
  const tapRef = useRef([]);
  const toastTimer = useRef(null);
  const orderCounter = useRef(1045);
  const paymentCounter = useRef(502);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const handleLogoTap = () => {
    const now = Date.now();
    tapRef.current = [...tapRef.current.filter((t) => now - t < 2000), now];
    if (tapRef.current.length >= 5) {
      tapRef.current = [];
      setShowLogin(true);
    }
  };

  const addOrder = async (partial) => {
    if (userToken && API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
          body: JSON.stringify({
            type: partial.type, amount: partial.amount, months: partial.months,
            recipient: partial.recipient, recipientUsername: partial.recipientUsername,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showToast(data.error || "Buyurtma qabul qilinmadi");
          return;
        }
        setUsers((prev) => prev.map((u) => (u.id === CURRENT_USER_ID ? { ...u, balance: data.newBalance } : u)));
        setOrders((prev) => [...prev, {
          id: data.orderId, userId: CURRENT_USER_ID, status: "Kutilmoqda", date: nowStr(), ...partial,
        }]);
        showToast(`Buyurtma qabul qilindi! #${data.orderId}`);
      } catch {
        showToast("Serverga ulanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
      }
      return;
    }

    // Backend mavjud bo'lmasa (masalan lokal/dizayn ko'rib chiqish uchun) - eski mock xatti-harakat.
    const id = `ORD-${orderCounter.current++}`;
    setOrders((prev) => [...prev, { id, userId: CURRENT_USER_ID, status: "Kutilmoqda", date: nowStr(), ...partial }]);
    showToast(`Buyurtma qabul qilindi! #${id}`);
  };

  const addPayment = async (partial) => {
    if (userToken && API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
          body: JSON.stringify({ amountUsd: partial.amountUsd, receiptDataUrl: partial.receiptDataUrl }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showToast(data.error || "Yuborilmadi");
          return;
        }
        setPaymentRequests((prev) => [...prev, {
          id: data.requestId, userId: CURRENT_USER_ID, status: "Kutilmoqda", date: nowStr(), ...partial,
        }]);
      } catch {
        showToast("Serverga ulanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
      }
      return;
    }
    const id = `PAY-${paymentCounter.current++}`;
    setPaymentRequests((prev) => [...prev, { id, userId: CURRENT_USER_ID, status: "Kutilmoqda", date: nowStr(), ...partial }]);
  };

  return (
    <div className="snx-root" style={{ minHeight: "100vh" }}>
      <GlobalStyle />
      <Toast toast={toast} />

      {view === "user" && (
        <UserApp
          users={users} orders={orders} addOrder={addOrder}
          addPayment={addPayment} onLogoTap={handleLogoTap} pricing={pricing} showToast={showToast}
          referralLink={referralLink}
        />
      )}

      {view === "admin" && (
        <AdminPanel
          pricing={pricing} setPricing={setPricing} showToast={showToast}
          adminToken={adminToken}
          onExit={() => { setAdminToken(null); setView("user"); }}
        />
      )}

      {showLogin && (
        <AdminLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={(token) => { setAdminToken(token); setShowLogin(false); setView("admin"); }}
        />
      )}
    </div>
  );
}
