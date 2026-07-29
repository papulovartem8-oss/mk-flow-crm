import {
  ACCESS_CODES,
  createSession,
  sessionSetCookie,
  sessionClearCookie,
} from "../../../lib/session";

// Вход: проверяем код доступа НА СЕРВЕРЕ и выдаём подписанную HttpOnly-куку.
export async function POST(request: Request) {
  try {
    const { name, code } = (await request.json()) as { name?: string; code?: string };
    const cleanName = (name ?? "").trim().slice(0, 80);
    // Принимаем и латинские коды, и привычные кириллические варианты
    // (например, MK-АДМИН на мобильной раскладке).
    const normalized = (code ?? "")
      .trim()
      .toUpperCase()
      .replace(/АДМИН/g, "ADMIN")
      .replace(/ЛИДЕР/g, "LEADER")
      .replace(/ТИМ/g, "TEAM")
      .replace(/ГЕН/g, "GEN")
      .replace(/ИНФЛУ/g, "INFLU");

    if (!cleanName) {
      return Response.json({ error: "Введите имя агента" }, { status: 400 });
    }

    const match = ACCESS_CODES[normalized];
    if (!match) {
      return Response.json({ error: "Неверный код доступа" }, { status: 401 });
    }

    const token = await createSession({
      name: cleanName,
      role: match.role,
      team: match.team,
      status: match.status,
    });

    return new Response(
      JSON.stringify({ name: cleanName, team: match.team, role: match.role, status: match.status }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": sessionSetCookie(token),
        },
      },
    );
  } catch {
    return Response.json({ error: "Ошибка авторизации" }, { status: 500 });
  }
}

// Выход: гасим куку.
export async function DELETE() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionClearCookie(),
    },
  });
}
