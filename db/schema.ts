import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  leadUserId: integer("lead_user_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  telegram: text("telegram"),
  role: text("role").notNull().default("manager"),
  teamId: integer("team_id").references(() => teams.id),
  status: text("status").notNull().default("active"),
  accessStartsAt: text("access_starts_at"),
  accessEndsAt: text("access_ends_at"),
  dailyAccessFrom: text("daily_access_from").notNull().default("08:00"),
  dailyAccessTo: text("daily_access_to").notNull().default("23:00"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientName: text("client_name").notNull(),
  phone: text("phone"),
  telegram: text("telegram"),
  whatsapp: text("whatsapp"),
  description: text("description").notNull().default(""),
  source: text("source").notNull(),
  product: text("product").notNull(),
  status: text("status").notNull().default("Новый"),
  amount: real("amount").notNull().default(0),
  managerId: integer("manager_id").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  issueType: text("issue_type"),
  issueNote: text("issue_note"),
  aiScore: integer("ai_score"),
  externalId: text("external_id"),
  importedFrom: text("imported_from"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const offers = sqliteTable("offers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  partnerName: text("partner_name").notNull(),
  title: text("title").notNull(),
  payout: real("payout").notNull().default(0),
  targetActionCost: real("target_action_cost").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leadOffers = sqliteTable("lead_offers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  offerId: integer("offer_id").references(() => offers.id),
  stage: text("stage").notNull().default("Новая заявка"),
  payout: real("payout").notNull().default(0),
  targetActionCost: real("target_action_cost").notNull().default(0),
  deliveryAt: text("delivery_at"),
  deliveryNote: text("delivery_note"),
  paidAt: text("paid_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  authorId: integer("author_id").references(() => users.id),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leadEvents = sqliteTable("lead_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  actorId: integer("actor_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  signedInAt: text("signed_in_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  signedOutAt: text("signed_out_at"),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const accessKeys = sqliteTable("access_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  codeHash: text("code_hash").notNull().unique(),
  role: text("role").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  maxUses: integer("max_uses").notNull().default(1),
  uses: integer("uses").notNull().default(0),
  expiresAt: text("expires_at"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const integrations = sqliteTable("integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull().unique(),
  status: text("status").notNull().default("inactive"),
  encryptedConfig: text("encrypted_config"),
  lastSyncAt: text("last_sync_at"),
  lastSyncStatus: text("last_sync_status"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Лиды CRM целиком как JSON — модель фронтенда богаче нормализованной
// таблицы `leads`, поэтому храним объект в одной колонке и не теряем поля
// (направление, трафик, офферы со статусами и т.д.). id задаёт фронтенд.
export const crmLeads = sqliteTable("crm_leads", {
  id: integer("id").primaryKey(),
  data: text("data").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const teamReports = sqliteTable("team_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamLead: text("team_lead").notNull(),
  team: text("team").notNull(),
  period: text("period").notNull(),
  completedTasks: text("completed_tasks").notNull(),
  currentState: text("current_state").notNull(),
  blockers: text("blockers").notNull().default(""),
  nextSteps: text("next_steps").notNull().default(""),
  completionPercent: integer("completion_percent").notNull().default(0),
  status: text("status").notNull().default("В работе"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
