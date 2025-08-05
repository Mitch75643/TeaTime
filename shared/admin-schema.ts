import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin fingerprints table - stores trusted device fingerprints
export const adminFingerprints = pgTable("admin_fingerprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fingerprint: varchar("fingerprint").unique().notNull(),
  label: varchar("label").notNull(), // Human-readable name for the device
  addedBy: varchar("added_by").notNull(), // Who added this fingerprint
  isRootHost: boolean("is_root_host").default(false), // The main host (can't be removed)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used"),
});

// Admin emails table - stores approved admin email addresses
export const adminEmails = pgTable("admin_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  fingerprint: varchar("fingerprint").notNull().references(() => adminFingerprints.fingerprint),
  role: varchar("role").default("admin"), // admin, root_host
  addedBy: varchar("added_by").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Admin sessions table - tracks authenticated admin sessions
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").unique().notNull(),
  fingerprint: varchar("fingerprint").notNull(),
  email: varchar("email").notNull(),
  role: varchar("role").notNull(),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
});

// Admin activity log - audit trail for admin actions
export const adminActivityLog = pgTable("admin_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminEmail: varchar("admin_email").notNull(),
  fingerprint: varchar("fingerprint").notNull(),
  action: varchar("action").notNull(), // login, logout, add_admin, remove_admin, etc.
  targetResource: varchar("target_resource"), // what was affected
  details: text("details"), // JSON string with additional details
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type definitions
export type AdminFingerprint = typeof adminFingerprints.$inferSelect;
export type InsertAdminFingerprint = typeof adminFingerprints.$inferInsert;

export type AdminEmail = typeof adminEmails.$inferSelect;
export type InsertAdminEmail = typeof adminEmails.$inferInsert;

export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;

export type AdminActivityLog = typeof adminActivityLog.$inferSelect;
export type InsertAdminActivityLog = typeof adminActivityLog.$inferInsert;

// Zod schemas
export const insertAdminFingerprintSchema = createInsertSchema(adminFingerprints);
export const insertAdminEmailSchema = createInsertSchema(adminEmails);
export const insertAdminSessionSchema = createInsertSchema(adminSessions);
export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLog);

// Admin verification schemas
export const adminLoginSchema = z.object({
  fingerprint: z.string().min(10, "Invalid fingerprint"),
  email: z.string().email("Invalid email address"),
});

export const addAdminSchema = z.object({
  fingerprint: z.string().min(10, "Fingerprint required"),
  fingerprintLabel: z.string().min(1, "Device label required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["admin", "root_host"]).default("admin"),
});

export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type AddAdmin = z.infer<typeof addAdminSchema>;