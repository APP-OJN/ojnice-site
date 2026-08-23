const TYPES = {
  news: "actualites",
  events: "evenements",
  stages: "stages",
  partners: "partenaires",
  messages: "messages"
};

export function tableForType(type) {
  return TYPES[type] || null;
}

function env(name) {
  return process.env[name] || "";
}

export async function supabaseRequest(path, options = {}) {
  const url = env("SUPABASE_URL");
  const secret = env("SUPABASE_SECRET_KEY");

  if (!url || !secret) {
    throw new Error("missing_supabase_configuration");
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: secret,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Supabase CMS error", response.status, text);
    throw new Error(`supabase_${response.status}`);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function cleanString(value, max = 10000) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, max);
}

export function toDbItem(type, item = {}) {
  if (type === "news") {
    return {
      ...(item.id ? { id: cleanString(item.id, 100) } : {}),
      t: cleanString(item.t, 300) || "Sans titre",
      c: cleanString(item.c, 100) || "Actualité",
      d: cleanString(item.d, 100),
      iso: cleanString(item._iso || item.iso, 50) || null,
      desc: cleanString(item.text || item.desc, 30000),
      video: cleanString(item.video, 3000) || null,
      img: cleanString(item.img, 200000) || null,
      u: cleanString(item.u, 3000) || null,
      published: item.published !== false
    };
  }

  if (type === "events") {
    return {
      ...(item.id ? { id: cleanString(item.id, 100) } : {}),
      t: cleanString(item.t, 300) || "Événement",
      d: cleanString(item.d, 100),
      lieu: cleanString(item.lieu, 300),
      desc: cleanString(item.desc, 30000),
      url: cleanString(item.url, 3000) || null,
      img: cleanString(item.img, 200000) || null,
      published: item.published !== false
    };
  }

  if (type === "stages") {
    return {
      ...(item.id ? { id: cleanString(item.id, 100) } : {}),
      t: cleanString(item.t, 300) || "Stage",
      tag: cleanString(item.tag, 200) || "Tous niveaux",
      days: cleanString(item.days, 300),
      dojo: cleanString(item.dojo, 300),
      who: cleanString(item.who, 500),
      price: cleanString(item.price, 100),
      url: cleanString(item.url, 3000) || null,
      img: cleanString(item.img, 200000) || null,
      alt: Boolean(item.alt),
      published: item.published !== false
    };
  }

  if (type === "partners") {
    return {
      ...(item.id ? { id: cleanString(item.id, 100) } : {}),
      t: cleanString(item.t, 300) || "Partenaire",
      cat: item.cat === "inst" ? "inst" : "priv",
      priori: Number.isFinite(Number(item.priori))
        ? Number(item.priori)
        : 0,
      url: cleanString(item.url, 3000) || null,
      img: cleanString(item.img, 200000) || null,
      published: item.published !== false
    };
  }

  throw new Error("invalid_content_type");
}

export function fromDbItem(type, row) {
  if (type === "news") {
    return {
      id: row.id,
      t: row.t || "",
      c: row.c || "Actualité",
      d: row.d || "",
      _iso: row.iso || "",
      text: row.desc || "",
      video: row.video || "",
      img: row.img || "",
      u: row.u || ""
    };
  }

  if (type === "events") {
    return {
      id: row.id,
      t: row.t || "",
      d: row.d || "",
      lieu: row.lieu || "",
      desc: row.desc || "",
      url: row.url || "",
      img: row.img || ""
    };
  }

  if (type === "stages") {
    return {
      id: row.id,
      t: row.t || "",
      tag: row.tag || "",
      days: row.days || "",
      dojo: row.dojo || "",
      who: row.who || "",
      price: row.price || "",
      url: row.url || "",
      img: row.img || "",
      alt: Boolean(row.alt)
    };
  }

  if (type === "partners") {
    return {
      id: row.id,
      t: row.t || "",
      cat: row.cat || "priv",
      priori: row.priori || 0,
      url: row.url || "",
      img: row.img || ""
    };
  }

  return row;
}
