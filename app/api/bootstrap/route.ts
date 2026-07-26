import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  leadOffers,
  leads,
  offers,
  sessions,
  teams,
  users,
} from "../../../db/schema";
import { isAccessResponse, requireAccess } from "../auth/access-session";

export async function GET(request: Request) {
  try {
    const access = await requireAccess(request);
    if (isAccessResponse(access)) return access;
    const db = getDb();
    const [teamRows, userRows, leadRows, offerRows, leadOfferRows, sessionRows] =
      await Promise.all([
        db.select().from(teams),
        db.select().from(users),
        db.select().from(leads).orderBy(desc(leads.createdAt)).limit(1000),
        db.select().from(offers),
        db.select().from(leadOffers).orderBy(desc(leadOffers.createdAt)).limit(5000),
        db.select().from(sessions).orderBy(desc(sessions.signedInAt)).limit(5000),
      ]);

    return Response.json({
      teams: teamRows,
      users: userRows,
      leads: leadRows,
      offers: offerRows,
      leadOffers: leadOfferRows,
      sessions: sessionRows,
      generatedAt: new Date().toISOString(),
      currentAccess: access,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось загрузить данные CRM";
    return Response.json({ error: message }, { status: 500 });
  }
}
