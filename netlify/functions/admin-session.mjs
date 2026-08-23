import { getSession } from "./_admin-auth.mjs";

export default async (request) => {
  const user = getSession(request);

  if (!user) {
    return Response.json(
      { ok: false, authenticated: false },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  return Response.json(
    {
      ok: true,
      authenticated: true,
      user
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
};

export const config = {
  path: "/api/admin/session",
  method: "GET"
};
