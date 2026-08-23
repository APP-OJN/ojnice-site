import { randomUUID } from "node:crypto";
import { getSession } from "./_admin-auth.mjs";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"]
]);

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export default async request => {
  const session = getSession(request);

  if (!session) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const type = String(form.get("type") || "news")
      .replace(/[^a-z0-9_-]/gi, "")
      .slice(0, 30);

    if (!file || typeof file.arrayBuffer !== "function") {
      return json({ ok: false, error: "missing_file" }, 400);
    }

    const ext = ALLOWED.get(file.type);

    if (!ext) {
      return json({ ok: false, error: "unsupported_file" }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return json({ ok: false, error: "file_too_large" }, 413);
    }

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const secret = process.env.SUPABASE_SECRET_KEY || "";

    if (!supabaseUrl || !secret) {
      throw new Error("missing_supabase_configuration");
    }

    const path =
      `${type}/${Date.now()}-${randomUUID()}.${ext}`;

    const upload = await fetch(
      `${supabaseUrl}/storage/v1/object/cms-media/${path}`,
      {
        method: "POST",
        headers: {
          apikey: secret,
          "Content-Type": file.type,
          "x-upsert": "false"
        },
        body: Buffer.from(await file.arrayBuffer())
      }
    );

    if (!upload.ok) {
      console.error(
        "Storage upload failed",
        upload.status,
        await upload.text()
      );

      throw new Error(`storage_${upload.status}`);
    }

    const publicUrl =
      `${supabaseUrl}/storage/v1/object/public/cms-media/${path}`;

    return json({
      ok: true,
      url: publicUrl,
      kind: file.type === "application/pdf" ? "pdf" : "image",
      mime: file.type
    });
  } catch (error) {
    console.error("CMS upload failed", error);
    return json({ ok: false, error: "upload_failed" }, 500);
  }
};

export const config = {
  path: "/api/cms/upload",
  method: "POST"
};
