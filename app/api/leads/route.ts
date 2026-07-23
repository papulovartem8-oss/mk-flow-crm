import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { leads } from "../../../db/schema";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(250);
    return Response.json({ leads: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить лиды";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      clientName?: string;
      phone?: string;
      telegram?: string;
      whatsapp?: string;
      description?: string;
      source?: string;
      product?: string;
      status?: string;
      amount?: number;
    };

    if (!input.clientName?.trim() || !input.source?.trim() || !input.product?.trim()) {
      return Response.json(
        { error: "clientName, source и product обязательны" },
        { status: 400 },
      );
    }

    const db = getDb();
    const [lead] = await db
      .insert(leads)
      .values({
        clientName: input.clientName.trim(),
        phone: input.phone?.trim(),
        telegram: input.telegram?.trim(),
        whatsapp: input.whatsapp?.trim(),
        description: input.description?.trim() ?? "",
        source: input.source.trim(),
        product: input.product.trim(),
        status: input.status?.trim() ?? "Новый",
        amount: input.amount ?? 0,
      })
      .returning();

    return Response.json({ lead }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать лид";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const input = (await request.json()) as {
      id?: number;
      source?: string;
      product?: string;
      status?: string;
      amount?: number;
      description?: string;
      issueType?: string | null;
    };

    if (!input.id) {
      return Response.json({ error: "id обязателен" }, { status: 400 });
    }

    const db = getDb();
    const [lead] = await db
      .update(leads)
      .set({
        ...(input.source !== undefined ? { source: input.source } : {}),
        ...(input.product !== undefined ? { product: input.product } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.issueType !== undefined ? { issueType: input.issueType } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(leads.id, input.id))
      .returning();

    return Response.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обновить лид";
    return Response.json({ error: message }, { status: 500 });
  }
}
