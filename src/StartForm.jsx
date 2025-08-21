import React, { useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";

// MVP: recibimos el cálculo como base64(JSON). Luego pasaremos a JWT con TTL.
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
      alert("Es necesario confirmar el anticipo del 10%.");
      return;
    }
    console.log("LEAD_MVP", { ...form, quote });
    alert("¡Solicitud enviada! Nuestro equipo se pondrá en contacto con usted muy pronto.");
    nav("/calc");
  };

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h1>Solicitud para iniciar el proyecto</h1>

      {quote ? (
        <div
          style={{
            padding: 12,
            background: "#f0f4ff",
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <div>
            <small>Superficie estimada:</small>{" "}
            <b>{Number(quote.areaM2).toFixed(2)} m²</b>
          </div>
          <div>
            <small>Coste aproximado del conjunto:</small>{" "}
            <b>{moneyFmt(quote.estimatedCostCents, quote.currency)}</b>
          </div>
          <div>
            <small>Anticipo (10%):</small>{" "}
            <b>{moneyFmt(quote.depositCents, quote.currency)}</b>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            El anticipo es un pago para los materiales de la plantilla y la toma
            de plantilla a bordo. Tras abonarlo, reservamos un hueco en el calendario.
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
            No hay datos del cálculo. Primero realiza el cálculo.
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
            Ir al cálculo
          </Link>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input
            name="name"
            placeholder="Nombre"
            value={form.name}
            onChange={onChange}
            required
          />
          <input
            name="surname"
            placeholder="Apellidos"
            value={form.surname}
            onChange={onChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input
            name="phone"
            placeholder="Teléfono (obligatorio)"
            value={form.phone}
            onChange={onChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico (opcional)"
            value={form.email}
            onChange={onChange}
          />
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input
            name="marina"
            placeholder="Marina de base"
            value={form.marina}
            onChange={onChange}
          />
          <input
            name="boatMakeModel"
            placeholder="Marca / modelo de la embarcación (opcional)"
            value={form.boatMakeModel}
            onChange={onChange}
          />
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>Método de contacto preferido</div>
          {["call", "whatsapp", "telegram"].map((m) => (
            <label key={m} style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="contactMethod"
                value={m}
                checked={form.contactMethod === m}
                onChange={onChange}
              />{" "}
              {m === "call" ? "Llamada" : m === "whatsapp" ? "WhatsApp" : "Telegram"}
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
          Confirmo que estoy listo para iniciar el proyecto abonando un anticipo de{" "}
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
          Enviar solicitud
        </button>
      </form>
    </div>
  );
}
