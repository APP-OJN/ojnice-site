import {
  configuredAdmin,
  createSessionCookie,
  verifyPassword
} from "./_admin-auth.mjs";

export default async (request) => {
  try {
    const configured = configuredAdmin();

    if (
      !configured.email ||
      !process.env.ADMIN_PASSWORD_HASH ||
      !process.env.ADMIN_SESSION_SECRET
    ) {
      console.error("Admin authentication environment is incomplete");
      return Response.json(
        { ok: false, error: "server_not_configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (email !== configured.email || !verifyPassword(password)) {
      return Response.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    return Response.json(
      {
        ok: true,
        user: configured
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": createSessionCookie(configured),
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("Admin login failed", error);

    return Response.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
};

export const config = {
  path: "/api/admin/login",
  method: "POST"
};
