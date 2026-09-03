import nodemailer from "nodemailer";
import { supabaseRequest } from "./_cms.mjs";

const ALLOWED_TYPES = new Set([
  "contact",
  "partner",
  "stage",
  "essai"
]);

const LABELS = {
  contact: "Contact",
  partner: "Partenariat",
  stage: "Stage",
  essai: "Cours d'essai"
};

const MAIL_TO = "infos.ojnice@gmail.com";

function clean(value, max = 5000) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, max);
}

function pick(fields, names) {
  for (const name of names) {
    if (fields[name]) return clean(fields[name]);
  }
  return "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendNotification(record, fields) {
  const smtpUser =
    process.env.GMAIL_SMTP_USER ||
    MAIL_TO;

  const smtpPass =
    (process.env.GMAIL_SMTP_APP_PASSWORD || "")
      .replace(/\s+/g, "");

  if (!smtpPass) {
    throw new Error("missing_gmail_app_password");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const label = LABELS[record.type] || "Message";

  const entries = Object.entries(fields)
    .filter(([, value]) => clean(value))
    .map(([key, value]) => [
      clean(key, 200),
      clean(value, 10000)
    ]);

  const textFields = entries
    .map(([key, value]) => `${key} : ${value}`)
    .join("\n\n");

  const htmlFields = entries
    .map(([key, value]) =>
      `<p style="margin:0 0 14px">
        <strong>${escapeHtml(key)}</strong><br>
        ${escapeHtml(value).replace(/\n/g, "<br>")}
      </p>`
    )
    .join("");

  await transporter.sendMail({
    from: `"Site Olympic Judo Nice" <${smtpUser}>`,
    to: MAIL_TO,
    replyTo: record.email || undefined,
    subject:
      `[OJNice.com] ${label}` +
      (record.subject ? ` — ${record.subject}` : ""),
    text:
      `Nouveau message depuis ojnice.com\n\n` +
      `Type : ${label}\n\n${textFields}`,
    html:
      `<h2>Nouveau message depuis ojnice.com</h2>
       <p><strong>Type :</strong> ${escapeHtml(label)}</p>
       ${htmlFields}`
  });
}

export default async request => {
  if (request.method !== "POST") {
    return Response.json(
      { ok: false, error: "method_not_allowed" },
      { status: 405 }
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body || !ALLOWED_TYPES.has(body.type)) {
      return Response.json(
        { ok: false, error: "invalid_form" },
        { status: 400 }
      );
    }

    const fields =
      body.fields &&
      typeof body.fields === "object" &&
      !Array.isArray(body.fields)
        ? body.fields
        : {};

    const record = {
      type: body.type,

      name: pick(fields, [
        "Nom",
        "nom",
        "Name",
        "name"
      ]) || null,

      email: pick(fields, [
        "Email",
        "E-mail",
        "email",
        "Mail"
      ]).slice(0, 500) || null,

      phone: pick(fields, [
        "Téléphone",
        "Telephone",
        "Phone",
        "phone"
      ]).slice(0, 100) || null,

      subject: pick(fields, [
        "Objet",
        "Sujet",
        "subject"
      ]).slice(0, 500) || null,

      message: pick(fields, [
        "Message",
        "message"
      ]).slice(0, 10000) || null,

      payload: fields,
      status: "new",
      is_read: false
    };

    // PRIORITÉ 1 : le message est toujours enregistré dans l'admin.
    await supabaseRequest("messages", {
      method: "POST",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify(record)
    });

    // PRIORITÉ 2 : notification email.
    let emailSent = false;

    try {
      await sendNotification(record, fields);
      emailSent = true;
    } catch (mailError) {
      console.error(
        "Contact email notification failed",
        mailError
      );
    }

    return Response.json(
      {
        ok: true,
        saved: true,
        emailSent
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("CMS form message failed", error);

    return Response.json(
      {
        ok: false,
        error: "message_not_saved"
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
};

export const config = {
  path: "/api/cms/message",
  method: "POST"
};
