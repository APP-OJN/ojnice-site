export default async () => {
  try {
    const url = process.env.SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secret) {
      return Response.json(
        {
          ok: false,
          database: false,
          error: "missing_configuration"
        },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" }
        }
      );
    }

    const response = await fetch(
      `${url}/rest/v1/actualites?select=id&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: secret,
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      console.error(
        "CMS health Supabase error:",
        response.status,
        await response.text()
      );

      return Response.json(
        {
          ok: false,
          database: false,
          status: response.status
        },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" }
        }
      );
    }

    return Response.json(
      {
        ok: true,
        database: true,
        service: "ojnice-site-cms"
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" }
      }
    );
  } catch (error) {
    console.error("CMS health failed:", error);

    return Response.json(
      {
        ok: false,
        database: false
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
};

export const config = {
  path: "/api/cms/health",
  method: "GET"
};
