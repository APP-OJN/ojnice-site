import {
  supabaseRequest,
  fromDbItem
} from "./_cms.mjs";

export default async () => {
  try {
    const configs = [
      ["news", "actualites"],
      ["events", "evenements"],
      ["stages", "stages"],
      ["partners", "partenaires"]
    ];

    const entries = await Promise.all(
      configs.map(async ([type, table]) => {
        const rows = await supabaseRequest(
          `${table}?select=*&published=eq.true&order=sort_order.asc,created_at.desc`
        );

        return [
          type,
          (rows || []).map(row => fromDbItem(type, row))
        ];
      })
    );

    return Response.json(
      {
        ok: true,
        data: Object.fromEntries(entries)
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("CMS public content failed", error);

    return Response.json(
      {
        ok: false,
        error: "content_unavailable"
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
  path: "/api/cms/content",
  method: "GET"
};
