import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { teamNews, workTasks } from "../../../db/schema";
import { requireSession } from "../../../lib/session";

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth instanceof Response) return auth;
  try {
    const db = getDb();
    const [news, tasks] = await Promise.all([
      db.select().from(teamNews).orderBy(desc(teamNews.createdAt)),
      db.select().from(workTasks).orderBy(desc(workTasks.createdAt)),
    ]);
    return Response.json({ news, tasks });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не удалось загрузить рабочие данные" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth instanceof Response) return auth;
  try {
    const body = (await request.json()) as Record<string, string>;
    const db = getDb();
    if (body.kind === "news") {
      if (!body.title?.trim() || !body.text?.trim()) return Response.json({ error: "Заполните заголовок и текст" }, { status: 400 });
      const [created] = await db.insert(teamNews).values({ title: body.title.trim(), body: body.text.trim(), author: body.author?.trim() || auth.name, role: body.role?.trim() || auth.role, team: body.team?.trim() || auth.team }).returning();
      return Response.json({ news: created }, { status: 201 });
    }
    if (body.kind === "task") {
      if (!body.title?.trim() || !body.owner?.trim()) return Response.json({ error: "Укажите задачу и ответственного" }, { status: 400 });
      const [created] = await db.insert(workTasks).values({ title: body.title.trim(), owner: body.owner.trim(), direction: body.direction?.trim() || "Операционка", due: body.due?.trim() || "Сегодня", status: body.status?.trim() || "Новая", team: body.team?.trim() || auth.team }).returning();
      return Response.json({ task: created }, { status: 201 });
    }
    return Response.json({ error: "Неизвестный тип записи" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не удалось сохранить запись" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSession(request);
  if (auth instanceof Response) return auth;
  try {
    const body = (await request.json()) as { kind?: string; id?: number; status?: string; title?: string; owner?: string; due?: string };
    if (body.kind !== "task" || !body.id || (!body.status && !body.title?.trim() && !body.owner?.trim() && !body.due?.trim())) return Response.json({ error: "Некорректная задача" }, { status: 400 });
    const changes: { status?: string; title?: string; owner?: string; due?: string; updatedAt: string } = { updatedAt: new Date().toISOString() };
    if (body.status) changes.status = body.status;
    if (body.title?.trim()) changes.title = body.title.trim();
    if (body.owner?.trim()) changes.owner = body.owner.trim();
    if (body.due?.trim()) changes.due = body.due.trim();
    const [updated] = await getDb().update(workTasks).set(changes).where(eq(workTasks.id, body.id)).returning();
    return updated ? Response.json({ task: updated }) : Response.json({ error: "Задача не найдена" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не удалось обновить задачу" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireSession(request);
  if (auth instanceof Response) return auth;
  try {
    const body = (await request.json()) as { kind?: string; id?: number };
    if (body.kind === "news" && body.id) await getDb().delete(teamNews).where(eq(teamNews.id, body.id));
    else if (body.kind === "task" && body.id) await getDb().delete(workTasks).where(eq(workTasks.id, body.id));
    else return Response.json({ error: "Некорректная запись" }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не удалось удалить запись" }, { status: 500 });
  }
}
