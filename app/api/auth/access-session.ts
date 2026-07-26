import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { accessSessions } from "../../../db/schema";

export const SESSION_COOKIE = "mk_access_session";

export type AccessIdentity = {
  role: string;
  label: string;
};

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

export async function getAccessIdentity(request: Request): Promise<AccessIdentity | null> {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;

  const db = getDb();
  const [session] = await db
    .select()
    .from(accessSessions)
    .where(eq(accessSessions.tokenHash, await sha256(token)))
    .limit(1);

  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return { role: session.role, label: session.label };
}

export async function requireAccess(request: Request): Promise<AccessIdentity | Response> {
  const identity = await getAccessIdentity(request);
  return identity ?? Response.json({ error: "Требуется код доступа" }, { status: 401 });
}

export function isAccessResponse(value: AccessIdentity | Response): value is Response {
  return value instanceof Response;
}
