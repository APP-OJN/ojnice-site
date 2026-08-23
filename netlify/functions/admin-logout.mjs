import { clearSessionCookie } from "./_admin-auth.mjs";

export default async () => {
  return Response.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "Set-Cookie": clearSessionCookie(),
        "Cache-Control": "no-store"
      }
    }
  );
};

export const config = {
  path: "/api/admin/logout",
  method: "POST"
};
