import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../db";
import { accessSessions } from "../../../../db/schema";
import {
  getAccessIdentity,
  SESSION_COOKIE,
  sha256,
} from "../access-session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  owner: "Владелец",
  partner: "Участник",
  influencer: "Лидогенератор",
  leader: "Тимлид",
  manager: "Менеджер",
};

export async function GET(request: Request) {
  try {
    const identity = await getAccessIdentity(request);
    if (!identity) return Response.json({ authenticated: false }, { status: 401 });
    return Response.json({ authenticated: true, ...identity });
  } catch {
    return Response.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { code?: string };
    const code = input.code?.trim().toUpperCase();
    if (!code) return Response.json({ error: "Введите код доступа" }, { status: 400 });

    const runtime = env as unknown as Record<string, string | undefined>;
    const rolesByCode = new Map<string, string>([
      [runtime.MK_ADMIN_ACCESS_CODE ?? "", "admin"],
      [runtime.MK_USER_ACCESS_CODE ?? "", "partner"],
      [runtime.MK_LEAD_ACCESS_CODE ?? "", "leader"],
      [runtime.MK_LEADER_ACCESS_CODE ?? "", "leader"],
      [runtime.MK_TEAM_ACCESS_CODE ?? "", "partner"],
      [runtime.MK_AGENT_ACCESS_CODE ?? "", "partner"],
      [runtime.MK_FQ_ACCESS_CODE ?? "", "partner"],
    ]);
    const role = rolesByCode.get(code);
    if (!role || !code) {
      return Response.json({ error: "Код недействителен или срок его действия истёк" }, { status: 403 });
    }

    const db = getDb();
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000).toISOString();
    const label = roleLabels[role] ?? "Пользователь";

    await db.insert(accessSessions).values({
      tokenHash: await sha256(token),
      role,
      label,
      expiresAt,
    });

    return Response.json(
      { authenticated: true, role, label },
      {
        headers: {
          "Set-Cookie": `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`,
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось выполнить вход";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const token = cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1);
    if (token) {
      const db = getDb();
      await db.delete(accessSessions).where(eq(accessSessions.tokenHash, await sha256(decodeURIComponent(token))));
    }
  } catch {
    // Cookie is cleared even if the stored session has already expired.
  }

  return Response.json(
    { authenticated: false },
    { headers: { "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` } },
  );
}
