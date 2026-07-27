import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { crmLeads } from "../../../db/schema";
import { requireSession } from "../../../lib/session";

type LeadJson = { id: number } & Record<string, unknown>;

// Читает все лиды CRM (JSON в колонке data). ТОЛЬКО для авторизованных.
export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  try {
    const db = getDb();
    const rows = await db.select().from(crmLeads).orderBy(asc(crmLeads.id)).limit(2000);
    const leads = rows
      .map((row) => {
        try {
          return JSON.parse(row.data) as LeadJson;
        } catch {
          return null;
        }
      })
      .filter((lead): lead is LeadJson => lead !== null);
    return Response.json({ leads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить лиды";
    return Response.json({ error: message }, { status: 500 });
  }
}

// Upsert одного лида ({ lead }) или пачки ({ leads }) по id. ТОЛЬКО для авторизованных.
export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  try {
    const input = (await request.json()) as { lead?: LeadJson; leads?: LeadJson[] };
    const list = input.leads ?? (input.lead ? [input.lead] : []);
    if (!list.length) {
      return Response.json({ error: "Нет данных лида" }, { status: 400 });
    }
    if (list.length > 500) {
      return Response.json({ error: "Слишком много лидов за раз (макс. 500)" }, { status: 413 });
    }

    const db = getDb();
    const now = new Date().toISOString();
    for (const lead of list) {
      if (typeof lead?.id !== "number") continue;
      await db
        .insert(crmLeads)
        .values({ id: lead.id, data: JSON.stringify(lead), updatedAt: now })
        .onConflictDoUpdate({
          target: crmLeads.id,
          set: { data: JSON.stringify(lead), updatedAt: now },
        });
    }

    return Response.json({ ok: true, saved: list.length }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить лид";
    return Response.json({ error: message }, { status: 500 });
  }
}
