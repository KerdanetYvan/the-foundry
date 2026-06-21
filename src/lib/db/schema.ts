import { pgTable, serial, varchar, timestamp, boolean, integer, text, real } from "drizzle-orm/pg-core";

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  maxUses: integer("max_uses").notNull(),
  useCount: integer("use_count").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 10 }).notNull().default("player"),
  whitelisted: boolean("whitelisted").notNull().default(false),
  invitationId: integer("invitation_id").references(() => invitations.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const serverMetrics = pgTable("server_metrics", {
  id: serial("id").primaryKey(),
  cpuPct: real("cpu_pct").notNull(),
  ramPct: real("ram_pct").notNull(),
  diskPct: real("disk_pct").notNull(),
  mcCpuPct: real("mc_cpu_pct"),
  mcRamPct: real("mc_ram_pct"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});
