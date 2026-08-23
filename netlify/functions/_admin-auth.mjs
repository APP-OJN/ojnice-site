import {
  createHmac,
  scryptSync,
  timingSafeEqual
} from "node:crypto";

const COOKIE_NAME = "ojnice_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;

function env(name) {
  return process.env[name] || "";
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value) {
  return createHmac("sha256", env("ADMIN_SESSION_SECRET"))
    .update(value)
    .digest("base64url");
}

export function verifyPassword(password) {
  const stored = env("ADMIN_PASSWORD_HASH");
  if (!stored || !password) return false;

  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function configuredAdmin() {
  return {
    email: env("ADMIN_EMAIL").trim().toLowerCase(),
    name: env("ADMIN_NAME") || "Administrateur",
    role: env("ADMIN_ROLE") === "super" ? "super" : "admin"
  };
}

export function createSessionCookie(user) {
  const payload = {
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS
  };

  const encoded = b64url(JSON.stringify(payload));
  const token = `${encoded}.${sign(encoded)}`;

  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }

  return "";
}

export function getSession(request) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  try {
    const expected = Buffer.from(sign(encoded));
    const received = Buffer.from(signature);

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
  } catch {
    return null;
  }
}
