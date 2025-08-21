// api/leads.js
const crypto = require("crypto");

// ТРАНСПОРТ 1: SMTP (если заданы SMTP_* переменные)
let transporterSMTP = null;
try {
  const nodemailer = require("nodemailer");
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporterSMTP = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true для 465
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
} catch (_) { /* nodemailer не установлен — ок */ }

// ТРАНСПОРТ 2: Resend (fallback, если есть ключ)
let resendClient = null;
try {
  const { Resend } = require("resend");
  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
} catch (_) { /* resend не установлен — ок */ }

// Утилиты
function moneyFmt(cents = 0, currency = "eur", locale = "es-ES") {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() })
      .format((Number(cents) || 0) / 100);
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

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "object" && req.body !== null ? req.body : await readJson(req);
    const {
      name, surname, phone, email, marina, boatMakeModel,
      contactMethod, confirmDeposit,
      areaM2, estimatedCostCents, depositCents, currency = "eur",
    } = body;

    // Базовая валидация
    if (!name || !surname || !phone) {
      return res.status(400).json({ error: "Faltan campos obligatorios (nombre, apellidos, teléfono)." });
    }
    if (!confirmDeposit) {
      return res.status(400).json({ error: "Es necesario confirmar el anticipo del 10%." });
    }

    const leadId = crypto.randomUUID();
    const depositFmt = moneyFmt(depositCents, currency);
    const estimateFmt = moneyFmt(estimatedCostCents, currency);

    const subject = `Nueva solicitud — ${name} ${surname} — anticipo ${depositFmt}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.5">
        <h2 style="margin:0 0 10px">Nueva solicitud para iniciar el proyecto</h2>
        <p><b>ID:</b> ${leadId}</p>
        <h3 style="margin:16px 0 6px">Datos del cálculo</h3>
        <ul>
          <li><b>Superficie estimada:</b> ${typeof areaM2 === "number" ? areaM2.toFixed(2) : "-"} m²</li>
          <li><b>Coste aproximado del conjunto:</b> ${estimateFmt}</li>
          <li><b>Anticipo (10%):</b> ${depositFmt}</li>
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
    const text =
`Nueva solicitud para iniciar el proyecto
ID: ${leadId}

[Datos del cálculo]
- Superficie estimada: ${typeof areaM2 === "number" ? areaM2.toFixed(2) : "-"} m²
- Coste aproximado del conjunto: ${estimateFmt}
- Anticipo (10%): ${depositFmt}

[Datos del cliente]
- Nombre: ${name} ${surname}
- Teléfono: ${phone}
- Correo: ${email || "-"}
- Marina de base: ${marina || "-"}
- Marca / modelo: ${boatMakeModel || "-"}
- Método de contacto: ${contactMethod || "-"}

Nota: el anticipo es un pago para los materiales de la plantilla y la toma de plantilla a bordo.`;

    // Отправка письма
    const TO = "sales@cubierta.org";
    const BCC = "es.rusakov.ka@gmail.com";

    if (transporterSMTP) {
      const from = process.env.MAIL_FROM || "CUBIERTA <no-reply@cubierta.org>";
      await transporterSMTP.sendMail({ from, to: "sales@cubierta.org", bcc: "es.rusakov.ka@gmail.com", replyTo: email || undefined, subject, text, html,});
    } else if (resendClient) {
      const from = process.env.MAIL_FROM || "CUBIERTA <onboarding@resend.dev>";
      await resendClient.emails.send({ from, to: [TO], bcc: [BCC], subject, html, text });
    } else {
      return res.status(500).json({
        error: "No hay transporte de correo configurado. Configure SMTP_* o RESEND_API_KEY.",
      });
    }

    return res.status(200).json({ ok: true, leadId });
  } catch (err) {
    console.error("api/leads error:", err);
    return res.status(500).json({ error: "Error del servidor" });
  }
};
