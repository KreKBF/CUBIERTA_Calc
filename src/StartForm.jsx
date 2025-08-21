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
    alert("Заявка (MVP) отправлена — на следующе
