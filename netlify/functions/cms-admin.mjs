import { getSession } from "./_admin-auth.mjs";
import {
  supabaseRequest,
  tableForType,
  toDbItem,
  fromDbItem
} from "./_cms.mjs";

function unauthorized() {
  return Response.json(
    { ok: false, error: "unauthorized" },
    {
      status: 401,
      headers: { "Cache-Control": "no-store" }
    }
  );
}

function badRequest(error = "bad_request") {
  return Response.json(
    { ok: false, error },
    {
      status: 400,
      headers: { "Cache-Control": "no-store" }
    }
  );
}

export default async request => {
  const session = getSession(request);
  if (!session) return unauthorized();

  try {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const type = url.searchParams.get("type") || "";
    const table = tableForType(type);

    if (!table) return badRequest("invalid_type");

    if (method === "GET") {
      if (type !== "messages") {
        const rows = await supabaseRequest(
          `${table}?select=*&order=sort_order.asc,created_at.desc`
        );

        return Response.json({
          ok: true,
          data: (rows || []).map(row => fromDbItem(type, row))
        });
      }

      const rows = await supabaseRequest(
        "messages?select=*&order=created_at.desc"
      );

      return Response.json({
        ok: true,
        data: rows || []
      });
    }

    if (method === "POST") {
      if (type === "messages") {
        return badRequest("invalid_operation");
      }

      const body = await request.json().catch(() => null);
      if (!body || !body.item) return badRequest();

      const dbItem = toDbItem(type, body.item);

      const rows = await supabaseRequest(
        `${table}?on_conflict=id`,
        {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: JSON.stringify(dbItem)
        }
      );

      const row = Array.isArray(rows) ? rows[0] : rows;

      return Response.json({
        ok: true,
        item: row ? fromDbItem(type, row) : null
      });
    }

    if (method === "DELETE") {
      if (type === "messages") {
        return badRequest("invalid_operation");
      }

      const id = (url.searchParams.get("id") || "").trim();
      if (!id) return badRequest("missing_id");

      await supabaseRequest(
        `${table}?id=eq.${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            Prefer: "return=minimal"
          }
        }
      );

      return Response.json({ ok: true });
    }

    if (method === "PATCH" && type === "messages") {
      const body = await request.json().catch(() => null);

      if (!body || !body.id) {
        return badRequest("missing_id");
      }

      const update = {};

      if (
        body.status === "new" ||
        body.status === "pending" ||
        body.status === "done"
      ) {
        update.status = body.status;
      }

      if (typeof body.is_read === "boolean") {
        update.is_read = body.is_read;
      }

      if (!Object.keys(update).length) {
        return badRequest("empty_update");
      }

      const rows = await supabaseRequest(
        `messages?id=eq.${encodeURIComponent(body.id)}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=representation"
          },
          body: JSON.stringify(update)
        }
      );

      return Response.json({
        ok: true,
        item: Array.isArray(rows) ? rows[0] : rows
      });
    }

    return Response.json(
      { ok: false, error: "method_not_allowed" },
      { status: 405 }
    );
  } catch (error) {
    console.error("CMS admin failed", error);

    return Response.json(
      {
        ok: false,
        error: "cms_error"
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
};

export const config = {
  path: "/api/cms/admin"
};
