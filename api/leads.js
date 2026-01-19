// CORS для работы внутри iframe (Wix) + preflight
function setCORS(req, res) {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin === "null" ? "*" : origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "600");
}

const crypto = require("crypto");

// === Опционально: Redis для счётчика (Upstash/Vercel KV) ===
// Требуются переменные окружения (любой набор):
// - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//   или
// - KV_REST_API_URL + KV_REST_API_TOKEN
let redis = null;
try {
  const { Redis } = require("@upstash/redis");
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
} catch (_) {
  /* библиотека не установлена — режим без Redis */
}

// ТРАНСПОРТ 1: SMTP (если заданы SMTP_* переменные)
let transporterSMTP = null;
try {
  const nodemailer = require("nodemailer");
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporterSMTP = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true для 465 (implicit TLS)
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
} catch (_) { /* nodemailer не установлен — ок */ }

// ТРАНСПОРТ 2: Resend (fallback, если есть ключ)
async function sendViaResendHTTP({ from, to, subject, html, text, headers }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: 'resend-not-configured' };

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      headers
    })
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    return { ok: false, error: new Error(`Resend HTTP ${resp.status}: ${t}`) };
  }
  return { ok: true };
}

// Утилиты
function moneyFmt(cents = 0, currency = "eur", locale = "es-ES") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format((Number(cents) || 0) / 100);
  } catch {
    return `${(Number(cents) || 0) / 100} ${currency || "eur"}`;
  }
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

// Мадридское «сейчас» + сек до полуночи (для TTL счётчика)
function tzNow(tz = "Europe/Madrid") {
  return new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
}
function secondsUntilMidnight(now = tzNow()) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((midnight - now) / 1000));
}

// Генерация короткого кода заявки: dd.mm.yyyy-###
// Если есть Redis → номер инкрементальный.
// Иначе fallback: «псевдопоследовательный» из UUID.
async function generateRefCode() {
  const now = tzNow();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  let seq = null;

  if (redis) {
    try {
      const key = `leads:${yyyy}${mm}${dd}`;
      seq = await redis.incr(key);                 // атомарный инкремент
      await redis.expire(key, secondsUntilMidnight(now)); // сбросится в полночь
    } catch (_) { /* если Redis недоступен — упадём в fallback */ }
  }

  if (!seq) {
    // Fallback: берём 3-значный код из UUID (не строго по порядку, но читабельно)
    const tail = crypto.randomUUID().replace(/-/g, "").slice(-4);
    seq = parseInt(tail, 16) % 1000; // 0..999
    if (seq === 0) seq = 1;
  }

  return `${dd}.${mm}.${yyyy}-${String(seq).padStart(3, "0")}`;
}

module.exports = async (req, res) => {
  // CORS + preflight
  setCORS(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "object" && req.body !== null ? req.body : await readJson(req);
    const {
      name, surname, phone, email, marina, boatMakeModel,
      contactMethod, confirmDeposit,
      areaM2, estimatedCostCents, depositCents, currency = "eur",
      company, startedAt, // антиспам (если добавите на форме)
    } = body;

    // Honeypot/антибот (опционально, безопасно не мешает)
    if (company && String(company).trim() !== "") {
      return res.status(200).json({ ok: true, leadId: "hp-" + crypto.randomUUID() });
    }
    const took = Date.now() - Number(startedAt || 0);
    if (!Number.isNaN(took) && took < 800) {
      return res.status(200).json({ ok: true, leadId: "fast-" + crypto.randomUUID() });
    }

    // Базовая валидация
    if (!name || !surname || !phone) {
      return res.status(400).json({ error: "Faltan campos obligatorios (nombre, apellidos, teléfono)." });
    }
    if (!confirmDeposit) {
      return res.status(400).json({ error: "Es necesario confirmar el anticipo del 10%." });
    }

    const leadId = crypto.randomUUID();      // технический UUID
    const refCode = await generateRefCode(); // читаемый код для людей
    const depositFmt = moneyFmt(depositCents, currency);
    const estimateFmt = moneyFmt(estimatedCostCents, currency);

    // --- Письмо менеджеру ---
    const subjectMgr = `[${refCode}] Nueva solicitud — ${name} ${surname} — anticipo ${depositFmt}`;
    const htmlMgr = `
      <div style="font-family: Arial, sans-serif; line-height:1.5">
        <h2 style="margin:0 0 10px">Nueva solicitud para iniciar el proyecto</h2>
        <p><b>ID técnico:</b> ${leadId}<br/><b>Referencia:</b> ${refCode}</p>
        <h3 style="margin:16px 0 6px">Datos del cálculo</h3>
        <ul>
          <li><b>Superficie estimada:</b> ${typeof areaM2 === "number" ? areaM2.toFixed(2) : "-"} m²</li>
          <li><b>Coste aproximado del conjunto:</b> ${estimateFmt}</li>
          <li><b>Pago de arranque:</b> ${depositFmt}</li>
        </ul>
        <h3 style="margin:16px 0 6px">Datos del cliente</h3>
        <ul>
          <li><b>Nombre:</b> ${name} ${surname}</li>
          <li><b>Teléfono:</b> ${phone}</li>
          <li><b>Correo:</b> ${email || "-"}</li>
          <li><b>Marina de base:</b> ${marina || "-"}</li>
          <li><b>Marca / modelo:</b> ${boatMakeModel || "-"}</li>
          <li><b>Método de contacto:</b> ${contactMethod || "-"}</li>
        </ul>
        <p style="font-size:12px;color:#666;margin-top:14px">
          Nota: el anticipo es un pago para los materiales de la plantilla y la toma de plantilla a bordo.
        </p>
      </div>
    `;
    const textMgr =
`Nueva solicitud para iniciar el proyecto
ID técnico: ${leadId}
Referencia: ${refCode}

[Datos del cálculo]
- Superficie estimada: ${typeof areaM2 === "number" ? areaM2.toFixed(2) : "-"} m²
- Coste aproximado del conjunto: ${estimateFmt}
- Pago de arranque: ${depositFmt}

[Datos del cliente]
- Nombre: ${name} ${surname}
- Teléfono: ${phone}
- Correo: ${email || "-"}
- Marina de base: ${marina || "-"}
- Marca / modelo: ${boatMakeModel || "-"}
- Método de contacto: ${contactMethod || "-"}

Nota: el anticipo es un pago para los materiales de la plantilla y la toma de plantilla a bordo.`;

    // --- Письмо клиенту (если указал e-mail) ---
    const subjectCl = `Tu solicitud #${refCode} — CUBIERTA`;
    const htmlCl = `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#111">
        <h2 style="margin:0 0 10px">¡Gracias! Hemos recibido tu solicitud</h2>
        <p>Referencia de solicitud: <b>${refCode}</b></p>
        <p>Resumen:</p>
        <ul>
          <li><b>Superficie estimada:</b> ${typeof areaM2 === "number" ? areaM2.toFixed(2) : "-"} m²</li>
          <li><b>Coste aproximado del conjunto:</b> ${estimateFmt}</li>
          <li><b>Pago de arranque:</b> ${depositFmt}</li>
        </ul>
        <p>Un gestor se pondrá en contacto contigo en las próximas horas para concretar los detalles y los siguientes pasos.</p>
        <p style="font-size:12px; color:#555">
          Nota: el anticipo es un pago para los materiales de la plantilla y la toma de plantilla a bordo.
        </p>
      </div>
    `;
    const textCl =
`¡Gracias! Hemos recibido tu solicitud.
Referencia: ${refCode}

Resumen:
- Superficie estimada: ${typeof areaM2 === "number" ? areaM2.toFixed(2) : "-"} m²
- Coste aproximado del conjunto: ${estimateFmt}
- Pago de arranque: ${depositFmt}

Un gestor se pondrá en contacto contigo en las próximas horas.`;

    // Отправка писем
    const TO = "sales@cubierta.org";
    const BCC = "es.rusakov.ka@gmail.com";
    const from = process.env.MAIL_FROM || "CUBIERTA <sales@cubierta.org>";
    const headers = { "List-Unsubscribe": "<mailto:sales@cubierta.org?subject=unsubscribe>" };

    // менеджеру
    if (transporterSMTP) {
      await transporterSMTP.sendMail({
        from, to: TO, bcc: BCC, replyTo: email || undefined,
        subject: subjectMgr, text: textMgr, html: htmlMgr, headers
      });
      // клиенту
      if (email) {
        await transporterSMTP.sendMail({
          from, to: email, subject: subjectCl, text: textCl, html: htmlCl, headers
        }).catch(() => {});
      }
    } else {
      // Fallback: Resend по HTTP
      const r1 = await sendViaResendHTTP({
        from, to: [TO], subject: subjectMgr, html: htmlMgr, text: textMgr, headers
      });
      if (!r1.ok) {
        console.error('Resend manager failed:', r1.error?.message || r1.reason);
        return res.status(502).json({ error: `Mail provider error: ${r1.error?.message || r1.reason}` });
      }
      if (email) {
        const r2 = await sendViaResendHTTP({
          from, to: [email], subject: subjectCl, html: htmlCl, text: textCl, headers
        });
        if (!r2.ok) console.warn('Resend client mail failed:', r2.error?.message || r2.reason);
      }
    } else {
      return res.status(500).json({
        error: "No hay transporte de correo configurado. Configure SMTP_* o RESEND_API_KEY.",
      });
    }

    return res.status(200).json({ ok: true, leadId, refCode });
  } catch (err) {
    console.error("api/leads error:", err);
    return res.status(500).json({ error: "Error del servidor" });
  }
};
