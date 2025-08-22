import React, { useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";

// Список марин: регион, название, город/описание
const MARINAS = [
  // Andalucía
  { region: "Andalucía", name: "Puerto Banús", city: "Marbella, Costa del Sol" },
  { region: "Andalucía", name: "Puerto Marina Benalmádena", city: "Benalmádena, Málaga" },
  { region: "Andalucía", name: "Puerto Deportivo de Estepona", city: "Estepona, Málaga" },
  { region: "Andalucía", name: "IGY Málaga Marina", city: "Málaga" },
  { region: "Andalucía", name: "Alcaidesa Marina", city: "Cádiz / La Línea de la Concepción" },

  // Catalunya
  { region: "Catalunya", name: "Marina Port Vell", city: "Barcelona" },
  { region: "Catalunya", name: "Port Tarraco", city: "Tarragona" },

  // Comunitat Valenciana
  { region: "Comunitat Valenciana", name: "Marina Alicante", city: "Alicante" },
  { region: "Comunitat Valenciana", name: "Marina Miramar", city: "Santa Pola" },
  { region: "Comunitat Valenciana", name: "Marina de las Dunas", city: "Guardamar" },
  { region: "Comunitat Valenciana", name: "Club Náutico Calpe", city: "Calpe" },
  { region: "Comunitat Valenciana", name: "Marina Campomanes", city: "Altea" },
  { region: "Comunitat Valenciana", name: "Club Náutico Moraira", city: "Moraira" },
  { region: "Comunitat Valenciana", name: "Club Náutico Torrevieja", city: "Torrevieja" },
  { region: "Comunitat Valenciana", name: "Club Náutico Altea", city: "Altea" },
  { region: "Comunitat Valenciana", name: "Club Náutico Villajoyosa", city: "Villajoyosa" },
  { region: "Comunitat Valenciana", name: "Club Náutico Benidorm", city: "Benidorm" },
  { region: "Comunitat Valenciana", name: "Marinas de Dénia – Real Club + Puerto Deportivo", city: "Dénia" },
  { region: "Comunitat Valenciana", name: "Valencia Mar / Marina Port Valencia", city: "Valencia" },
  { region: "Comunitat Valenciana", name: "Club Náutico Vinaròs", city: "Vinaròs" },
];

// Отсортируем: регион (алфавит, es) → название (алфавит, es)
const MARINA_OPTIONS = [...MARINAS].sort(
  (a, b) =>
    a.region.localeCompare(b.region, "es") ||
    a.name.localeCompare(b.name, "es")
);

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
  const quote = useQuote();

  // «комбобокс»: текст + подсказки
  const [marinaInput, setMarinaInput] = useState("");

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

  const submit = async (e) => {
    e.preventDefault();
    if (!form.confirmDeposit) {
      alert("Es necesario confirmar el anticipo del 10%.");
      return;
    }

    const marinaFinal = marinaInput.trim();

    try {
      const payload = {
        ...form,
        marina: marinaFinal, // итоговое значение
        areaM2: quote?.areaM2,
        estimatedCostCents: quote?.estimatedCostCents,
        depositCents: quote?.depositCents,
        currency: quote?.currency || "eur",
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

        let data = null;
        try { data = await res.json(); } catch {}
        if (!res.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        alert("No se pudo enviar la solicitud: " + msg);
        return;
      }
      const rawQuote = new URLSearchParams(window.location.search).get("quote")
      || btoa(JSON.stringify({
          areaM2: quote?.areaM2,
          estimatedCostCents: quote?.estimatedCostCents,
          depositCents: quote?.depositCents,
          currency: quote?.currency || "eur",
        }));

    // переход на страницу «Gracias»
    const lead = data?.leadId ? `lead=${encodeURIComponent(data.leadId)}&` : "";
      window.top?.location.assign(`/gracias?${lead}quote=${encodeURIComponent(rawQuote)}`);
    } catch (err) {
      console.error(err);
      alert("Error al enviar la solicitud. Inténtalo de nuevo.");
    }
  };

      // очистка полей
      setMarinaInput("");
      setForm({
        name: "",
        surname: "",
        phone: "",
        email: "",
        marina: "",
        boatMakeModel: "",
        contactMethod: "call",
        confirmDeposit: false,
      });
    } catch (err) {
      console.error(err);
      alert("Error al enviar la solicitud. Inténtalo de nuevo.");
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h1>Solicitud para iniciar el proyecto</h1>

      {quote ? (
        <div style={{ padding: 12, background: "#f0f4ff", borderRadius: 12, marginTop: 8 }}>
          <div><small>Superficie estimada:</small> <b>{Number(quote.areaM2).toFixed(2)} m²</b></div>
          <div><small>Coste aproximado del conjunto:</small> <b>{moneyFmt(quote.estimatedCostCents, quote.currency)}</b></div>
          <div><small>Anticipo (10%):</small> <b>{moneyFmt(quote.depositCents, quote.currency)}</b></div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            El anticipo es un pago para los materiales de la plantilla y la toma de plantilla a bordo. Tras abonarlo, reservamos un hueco en el calendario.
          </div>
        </div>
      ) : (
        <div style={{ padding: 12, background: "#fff3cd", borderRadius: 12, marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>No hay datos del cálculo. Primero realiza el cálculo.</div>
          <Link to="/calc" style={{ display: "inline-block", padding: "10px 14px", borderRadius: 10, background: "#000", color: "#fff" }}>
            Ir al cálculo
          </Link>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input name="name" placeholder="Nombre" value={form.name} onChange={onChange} required />
          <input name="surname" placeholder="Apellidos" value={form.surname} onChange={onChange} required />
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
         <input type="tel" name="phone" placeholder="Teléfono (obligatorio)" value={form.phone} onChange={onChange} autoComplete="tel" pattern="^[+()\s-]*\d(?:[()\s-]*\d){6,}$"  // ≥7 цифр, допускаем + () - пробел
  required
/>
          <input type="email" name="email" placeholder="Correo electrónico (obligatorio)" value={form.email} onChange={onChange} autoComplete="email" required/>
        </div>

        {/* Marina + Marca/Modelo — 2 колонки */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          {/* Columna 1: Marina combobox (input + datalist) */}
          <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#555" }}>
              Marina de base
            </label>

            <input
              list="marinasList"
              value={marinaInput}
              onChange={(e) => setMarinaInput(e.target.value)}
              placeholder="Empieza a escribir… (puedes elegir o escribir la tuya)"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bbb" }}
              required
            />

            <datalist id="marinasList">
              {MARINA_OPTIONS.map((m) => {
                const value = `${m.name} (${m.city})`;
                const label = `${m.region} — ${m.name} (${m.city})`;
                return <option key={label} value={value} label={label} />;
              })}
            </datalist>

            {marinaInput.trim() && (
              <div style={{ marginTop: 6 }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(marinaInput.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13 }}
                >
                  Ver en Google Maps ↗
                </a>
              </div>
            )}
          </div>

          {/* Columna 2: Marca/Modelo */}
          <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#555" }}>
              Marca / modelo de la embarcación (opcional)
            </label>
            <input
              name="boatMakeModel"
              value={form.boatMakeModel}
              onChange={onChange}
              placeholder="Beneteau, Bavaria, Azimut…"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bbb" }}
            />
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>Método de contacto preferido</div>
          {["call", "whatsapp", "telegram"].map((m) => (
            <label key={m} style={{ marginRight: 12 }}>
              <input type="radio" name="contactMethod" value={m} checked={form.contactMethod === m} onChange={onChange} />{" "}
              {m === "call" ? "Llamada" : m === "whatsapp" ? "WhatsApp" : "Telegram"}
            </label>
          ))}
        </div>

        <label>
          <input type="checkbox" name="confirmDeposit" checked={form.confirmDeposit} onChange={onChange} required />{" "}
          Confirmo que estoy listo para iniciar el proyecto abonando un anticipo de{" "}
          <b>{moneyFmt(quote?.depositCents || 0, quote?.currency || "eur")}</b>
        </label>

        <button type="submit" className="cta-btn cta-wide">Enviar solicitud</button>
      </form>
    </div>
  );
}
