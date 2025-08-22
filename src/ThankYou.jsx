// src/ThankYou.jsx
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function useQuote() {
  const q = useQuery();
  const raw = q.get("quote");
  return useMemo(() => {
    if (!raw) return null;
    try { return JSON.parse(atob(raw)); } catch { return null; }
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

export default function ThankYou() {
  const q = useQuery();
  const quote = useQuote();

  // приоритет: читаемый код (ref) -> технический id (lead)
  const ref = q.get("ref") || "";
  const lead = q.get("lead") || "";
  const idLabel = ref ? "Referencia de solicitud" : "ID de solicitud";
  const idValue = ref || lead || "—";

  const area = typeof quote?.areaM2 === "number" ? quote.areaM2.toFixed(2) : "-";
  const estimate = moneyFmt(quote?.estimatedCostCents, quote?.currency);
  const deposit = moneyFmt(quote?.depositCents, quote?.currency);

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h1>¡Gracias! Hemos recibido tu solicitud</h1>

      {/* hero (опционально, если добавляли файл /images/thankyou-hero.webp) */}
      {/* <div className="ty-hero">
        <img
          src="/images/thankyou-hero.webp"
          srcSet="/images/thankyou-hero@2x.webp 2x"
          alt="Velero navegando en mar abierto"
          loading="lazy"
        />
      </div> */}

      <div
        style={{
          padding: 16,
          background: "#eaf1ff",
          borderRadius: 12,
          marginTop: 8,
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <small>{idLabel}:</small>{" "}
          <b style={{ letterSpacing: 0.2 }}>{idValue}</b>
        </div>

        <div>
          <small>Superficie estimada:</small> <b>{area} m²</b>
        </div>
        <div>
          <small>Coste aproximado del conjunto:</small> <b>{estimate}</b>
        </div>
        <div>
          <small>Anticipo (10%):</small> <b>{deposit}</b>
        </div>

        <p style={{ marginTop: 12 }}>
          Nuestro equipo se pondrá en contacto contigo en las próximas horas para
          concretar los detalles del proyecto y los siguientes pasos.
        </p>
      </div>

      <div style={{ marginTop: 20 }}>
        {/* target="_top" — чтобы выйти из iframe Wix при клике */}
        <a href="/calc" target="_top" rel="noopener" className="cta-btn cta-wide">
          Volver a la calculadora
        </a>
      </div>
    </div>
  );
}
