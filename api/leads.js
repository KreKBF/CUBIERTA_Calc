// ---------- CORS ----------
function setCORS(req, res) {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin === "null" ? "*" : origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "600");
}

const crypto = require("crypto");

// ---------- Опц. Redis (не обязателен) ----------
let redis = null;
try {
  const { Redis } = require("@upstash/redis");
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) redis = new Redis({ url, token });
} catch {}

// ---------- SMTP транспорт (если настроен) ----------
let transporterSMTP = null;
try {
  const nodemailer = require("nodemailer");
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporterSMTP = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // 465 -> true, 587 -> false
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { servername: process.env.SMTP_HOST }
    });
  }
} catch {}

// ---------- Утилиты ----------
function moneyFmt(cents = 0, currency = "eur", locale = "es-ES") {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() })
      .format((Number(cents) || 0) / 100);
  } catch {
    return `${(Number(cents) || 0) / 100} ${currency || "eur"}`;
  }
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

function tzNow(tz = "Europe/Madrid") {
  return new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
}
function secondsUntilMidnight(now = tzNow()) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((midnight - now) / 1000));
}

async function generateRefCode() {
  const now = tzNow();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  let seq = null;
  if (redis) {
    try {
      const key = `leads:${yyyy}${mm}${dd}`;
      seq = await redis.incr(key);
      await redis.expire(key, secondsUntilMidnight(now));
    } catch {}
  }
  if (!seq) {
    const tail = crypto.randomUUID().replace(/-/g, "").slice(-4);
    seq = parseInt(tail, 16) % 1000 || 1;
  }
  return `${dd}.${mm}.${yyyy}-${String(seq).padStart(3, "0")}`;
}

// ---------- Resend через HTTP (без SDK) ----------
async function sendViaResendHTTP({ from, to, subject, html, text /*, headers*/ }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "resend-not-configured" };

  // Важно: у Resend поле headers опционально; убираем на время диагностики.
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    })
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    return { ok: false, error: new Error(`Resend HTTP ${resp.status}: ${t}`) };
  }
  return { ok: true };
}

// ---------- SMTP helper ----------
async function sendViaSMTP({ from, to, subject, html, text, replyTo, bcc }) {
  if (!transporterSMTP) return { ok: false, reason: "smtp-not-configured" };
  try {
    await transporterSMTP.sendMail({ from, to, subject, html, text, replyTo, bcc });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

// ================== ХЭНДЛЕР ==================
module.exports = async (req, res) => {
  setCORS(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // --- Парсим тело ---
    const body = await readJson(req);
    const {
      name, surname, phone, email, marina, boatMakeModel,
      contactMethod, confirmDeposit,
      areaM2, estimatedCostCents, depositCents, currency = "eur",
      company, startedAt
    } = body || {};

    // Быстрый лог окружения (без секретов)
    const mask = s => (s ? s.slice(0, 4) + "…" + s.slice(-4) : null);
    console.log("MAIL_ENV", {
      hasSMTP: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      hasResend: !!process.env.RESEND_API_KEY,
      resend: mask(process.env.RESEND_API_KEY || ""),
      from: process.env.MAIL_FROM
    });

    // Антибот
    if (company && String(company).trim() !== "") {
      return res.status(200).json({ ok: true, leadId: "hp-" + crypto.randomUUID() });
    }
    const took = Date.now() - Number(startedAt || 0);
    if (!Number.isNaN(took) && took < 800) {
      return res.status(200).json({ ok: true, leadId: "fast-" + crypto.randomUUID() });
    }

    // Валидация
    if (!name || !surname || !phone) return res.status(400).send("Campos obligatorios: nombre, apellidos, teléfono.");
    if (!confirmDeposit) return res.status(400).send("Es necesario confirmar el anticipo del 10%.");

    const leadId = crypto.randomUUID();
    const refCode = await generateRefCode();
    const depositFmt = moneyFmt(depositCents, currency);
    const estimateFmt = moneyFmt(estimatedCostCents, currency);

    const subjectMgr = `[${refCode}] Nueva solicitud — ${name} ${surname} — anticipo ${depositFmt}`;
    const htmlMgr = `
      <div style="font-family: Arial, sans-serif; line-height:1.5">
        <h2 style="margin:0 0 10px">Nueva solicitud para iniciar el proyecto</h2>
        <p><b>ID técnico:</b> ${leadId}<br/><b>Referencia:</b> ${refCode}</p>
        <ul>
          <li><b>Superficie estimada:</b> ${typeof areaM2 === "number" ? areaM2.toFixed(2) : "-"} m²</li>
          <li><b>Coste aproximado del conjunto:</b> ${estimateFmt}</li>
          <li><b>Pago de arranque:</b> ${depositFmt}</li>
        </ul>
        <ul>
          <li><b>Nombre:</b> ${name} ${surname}</li>
          <li><b>Teléfono:</b> ${phone}</li>
          <li><b>Correo:</b> ${email || "-"}</li>
          <li><b>Marina de base:</b> ${marina || "-"}</li>
          <li><b>Marca / modelo:</b> ${boatMakeModel || "-"}</li>
          <li><b>Método de contacto:</b> ${contactMethod || "-"}</li>
        </ul>
      </div>`;
    const textMgr =
`Nueva solicitud
ID: ${leadId}
Ref: ${refCode}
Area: ${typeof areaM2 === "number" ? areaM2.toFixed(2) : "-"} m²
Coste: ${estimateFmt}
Anticipo: ${depositFmt}
Cliente: ${name} ${surname}, ${phone}, ${email || "-"}`;

    const subjectCl = `Tu solicitud #${refCode} — CUBIERTA`;
    const htmlCl = `<div style="font-family: Arial, sans-serif">¡Gracias! Hemos recibido tu solicitud #${refCode}.</div>`;
    const textCl = `Gracias, hemos recibido tu solicitud #${refCode}.`;

    const TO = "sales@cubierta.org";
    const BCC = "es.rusakov.ka@gmail.com";
    const from = process.env.MAIL_FROM || "CUBIERTA <sales@cubierta.org>";

    // ------- ОТПРАВКА -------
    // 1) SMTP менеджеру
    let r = await sendViaSMTP({ from, to: [TO], subject: subjectMgr, html: htmlMgr, text: textMgr, replyTo: email || undefined, bcc: [BCC] });
    if (!r.ok) {
      if (r.error) console.error("SMTP manager failed:", r.error);
      // 2) Resend менеджеру (HTTP)
      r = await sendViaResendHTTP({ from, to: [TO], subject: subjectMgr, html: htmlMgr, text: textMgr });
      if (!r.ok) {
        const msg = r.error?.message || r.reason || "mail-send-failed";
        console.error("Resend manager failed:", msg);
        return res.status(502).send(`Mail provider error: ${msg}`);
      }
    }

    // Письмо клиенту (best-effort)
    if (email) {
      const rc1 = await sendViaSMTP({ from, to: [email], subject: subjectCl, html: htmlCl, text: textCl });
      if (!rc1.ok) {
        const rc2 = await sendViaResendHTTP({ from, to: [email], subject: subjectCl, html: htmlCl, text: textCl });
        if (!rc2.ok) console.warn("Client mail failed:", rc2.error?.message || rc2.reason);
      }
    }

    return res.status(200).json({ ok: true, leadId, refCode });
  } catch (e) {
    // ВАЖНО: отдаём понятный ТЕКСТ, а не JSON — чтобы алёрт показал причину
    console.error("api/leads fatal:", e);
    return res.status(500).send(e?.message || "Server error");
  }
};
