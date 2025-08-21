import React, { useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";

// ВРЕМЕННО: принимаем quote как base64(JSON). Далее заменим на JWT с TTL.
function useQuote() {
  const { search } = useLocation();
  const raw = new URLSearchParams(search).get("quote");
  return useMemo(() => {
    if (!raw) return null;
    try {
      const json = atob(raw);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [raw]);
}

function moneyFmt(cents, currency = "eur", locale = "es-ES") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format((cents || 0) / 100);
  } catch {
    return `${(cents || 0) / 100} ${currency || "eur"}`;
  }
}

export default function StartForm() {
  const nav = useNavigate();
  const quote = useQuote();

  const [form, setForm] = useState({
    name: "",
    surname: "",
    phone: "",
    email: "",
    marina: "",
    boatMakeModel: "",
    contactMethod: "call",
    confirmDeposit: false,
  });

  const onChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.confirmDeposit) {
      alert("Нужно подтвердить готовность внести 10%");
      return;
    }
    console.log("LEAD_MVP", { ...form, quote });
    alert("Заявка (MVP) отправлена — на следующем шаге подключим оплату и письма.");
    nav("/calc");
  };

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h1>Заявка на старт проекта</h1>

      {quote ? (
        <div
          style={{
            padding: 12,
            background: "#f7f7f7",
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <div>
            <small>Площадь покрытия:</small>{" "}
            <b>{Number(quote.areaM2).toFixed(2)} м²</b>
          </div>
          <div>
            <small>Ориентировочная стоимость:</small>{" "}
            <b>{moneyFmt(quote.estimatedCostCents, quote.currency)}</b>
          </div>
          <div>
            <small>Предоплата (10%):</small>{" "}
            <b>{moneyFmt(quote.depositCents, quote.currency)}</b>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Предоплата — аванс за материалы для шаблона и снятие шаблона на борту.
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 12,
            background: "#fff3cd",
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            Нет данных расчёта. Сначала выполните расчёт.
          </div>
          <Link
            to="/calc"
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 10,
              background: "#000",
              color: "#fff",
            }}
          >
            Перейти к расчёту
          </Link>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input
            name="name"
            placeholder="Имя"
            value={form.name}
            onChange={onChange}
            required
          />
          <input
            name="surname"
            placeholder="Фамилия"
            value={form.surname}
            onChange={onChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input
            name="phone"
            placeholder="Телефон (обязательно)"
            value={form.phone}
            onChange={onChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email (по желанию)"
            value={form.email}
            onChange={onChange}
          />
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input
            name="marina"
            placeholder="Марина базирования"
            value={form.marina}
            onChange={onChange}
          />
          <input
            name="boatMakeModel"
            placeholder="Марка/модель лодки (опционально)"
            value={form.boatMakeModel}
            onChange={onChange}
          />
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>Предпочтительный способ связи</div>
          {["call", "whatsapp", "telegram"].map((m) => (
            <label key={m} style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="contactMethod"
                value={m}
                checked={form.contactMethod === m}
                onChange={onChange}
              />{" "}
              {m === "call" ? "Звонок" : m === "whatsapp" ? "WhatsApp" : "Telegram"}
            </label>
          ))}
        </div>

        <label>
          <input
            type="checkbox"
            name="confirmDeposit"
            checked={form.confirmDeposit}
            onChange={onChange}
            required
          />{" "}
          Подтверждаю готовность начать проект с внесения предоплаты в размере{" "}
          <b>{moneyFmt(quote?.depositCents || 0, quote?.currency || "eur")}</b>
        </label>

        <button
          type="submit"
          style={{
            padding: "12px 18px",
            borderRadius: 14,
            background: "#000",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Подать заявку
        </button>
      </form>
    </div>
  );
}
