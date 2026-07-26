import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { teamReports } from "../../../db/schema";
import { isAccessResponse, requireAccess } from "../auth/access-session";

export async function GET(request: Request) {
  try {
    const access = await requireAccess(request);
    if (isAccessResponse(access)) return access;
    const db = getDb();
    const reports = await db
      .select()
      .from(teamReports)
      .orderBy(desc(teamReports.createdAt))
      .limit(100);

    return Response.json({ reports });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось загрузить отчёты";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess(request);
    if (isAccessResponse(access)) return access;
    const input = (await request.json()) as {
      teamLead?: string;
      team?: string;
      period?: string;
      completedTasks?: string;
      currentState?: string;
      blockers?: string;
      nextSteps?: string;
      completionPercent?: number;
      status?: string;
    };

    if (
      !input.teamLead?.trim() ||
      !input.team?.trim() ||
      !input.period?.trim() ||
      !input.completedTasks?.trim() ||
      !input.currentState?.trim()
    ) {
      return Response.json(
        { error: "Заполните тимлида, команду, период, выполненные задачи и состояние дел" },
        { status: 400 },
      );
    }

    const completionPercent = Math.min(
      100,
      Math.max(0, Number(input.completionPercent ?? 0)),
    );
    const db = getDb();
    const [report] = await db
      .insert(teamReports)
      .values({
        teamLead: input.teamLead.trim(),
        team: input.team.trim(),
        period: input.period.trim(),
        completedTasks: input.completedTasks.trim(),
        currentState: input.currentState.trim(),
        blockers: input.blockers?.trim() ?? "",
        nextSteps: input.nextSteps?.trim() ?? "",
        completionPercent,
        status: input.status?.trim() ?? "В работе",
      })
      .returning();

    return Response.json({ report }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сохранить отчёт";
    return Response.json({ error: message }, { status: 500 });
  }
}
