import { env } from "cloudflare:workers";

// Роли системы (совпадают с клиентскими).
export type Role = "admin" | "leader" | "teamlead" | "leadgen" | "influencer";

export type SessionPayload = {
  name: string;
  role: Role;
  team: string;
  status: string;
  exp: number; // ms epoch, когда сессия истекает
};

// КОДЫ ДОСТУПА — только на сервере. В клиентский бандл больше не попадают,
// поэтому их нельзя вытащить из исходников страницы.
export const ACCESS_CODES: Record<string, { team: string; role: Role; status: string }> = {
  "MK-ADMIN": { team: "M&K · Центр управления", role: "admin", status: "Platinum" },
  "MK-LEADER": { team: "«Excellent»", role: "leader", status: "Gold" },
  "MK-TEAM": { team: "«Excellent»", role: "teamlead", status: "Gold" },
  "MK-GEN": { team: "«Excellent»", role: "leadgen", status: "Silver" },
  "MK-INFLU": { team: "Запуск · Blogsphere", role: "influencer", status: "Gold" },
};

const enc = new TextEncoder();
const dec = new TextDecoder();
const COOKIE = "mk_session";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 часов

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const norm = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(norm);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  const secret = (env as unknown as { SESSION_SECRET?: string }).SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET не задан");
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// Создаёт подписанный токен сессии (тело.подпись). Подделать без секрета нельзя.
export async function createSession(data: Omit<SessionPayload, "exp">): Promise<string> {
  const payload: SessionPayload = { ...data, exp: Date.now() + TTL_MS };
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const key = await getKey();
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  return `${body}.${b64urlEncode(sig)}`;
}

// Проверяет подпись и срок действия. Возвращает данные сессии или null.
export async function verifySession(token: string | null): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const key = await getKey();
    const ok = await crypto.subtle.verify("HMAC", key, b64urlDecode(sig) as unknown as BufferSource, enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(b64urlDecode(body))) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readSessionCookie(request: Request): string | null {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionSetCookie(token: string): string {
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${Math.floor(TTL_MS / 1000)}`;
}

export function sessionClearCookie(): string {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

// Гард для защищённых API. Если сессии нет — возвращает 401 (иначе данные лида).
export async function requireSession(request: Request): Promise<SessionPayload | Response> {
  const payload = await verifySession(readSessionCookie(request));
  if (!payload) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  return payload;
}
