import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

// читаем quote из query (?quote=base64(JSON))
function useQuote() {
  const { search } = useLocation();
  const raw = new URLSearchParams(search).get("quote");
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
  const { search } = useLocation();
  const quote = useQuote();
  const leadId = new URLSearchParams(search).get("lead") || "";

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h1>¡Gracias! Hemos recibido tu solicitud</h1>

      <div style={{
        padding: 16, background: "#eaf3ff", borderRadius: 12, marginTop: 8
      }}>
        {!!leadId && (
          <div style={{ marginBottom: 6 }}>
            <small>ID de solicitud:</small> <b>{leadId}</b>
          </div>
        )}

        {quote ? (
          <>
            <div><small>Superficie estimada:</small> <b>{Number(quote.areaM2).toFixed(2)} m²</b></div>
            <div><small>Coste aproximado del conjunto:</small> <b>{moneyFmt(quote.estimatedCostCents, quote.currency)}</b></div>
            <div><small>Anticipo (10%):</small> <b>{moneyFmt(quote.depositCents, quote.currency)}</b></div>
          </>
        ) : (
          <div>No hay datos del cálculo adjuntos.</div>
        )}

        <p style={{ fontSize: 14, color: "#42526e", marginTop: 10 }}>
          Nuestro equipo se pondrá en contacto contigo en las próximas horas
          para concretar los detalles del proyecto y los siguientes pasos.
        </p>
      </div>

      <div style={{ marginTop: 18 }}>
        <Link to="/calc" className="cta-btn cta-wide" style={{ textDecoration: "none" }}>
          Volver a la calculadora
        </Link>
      </div>
    </div>
  );
}
