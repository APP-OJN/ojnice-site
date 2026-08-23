import { supabaseRequest } from "./_cms.mjs";

const ALLOWED_TYPES = new Set([
  "contact",
  "partner",
  "stage",
  "essai"
]);

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

    await supabaseRequest(
      "messages",
      {
        method: "POST",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify(record)
      }
    );

    return Response.json(
      { ok: true },
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
