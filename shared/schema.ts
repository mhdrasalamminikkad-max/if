import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students Table - for quota tracking
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  name: text("name").notNull(),
  monthlyQuotaMinutes: integer("monthly_quota_minutes").notNull().default(120),
  usedMinutes: integer("used_minutes").notNull().default(0),
  extraMinutes: integer("extra_minutes").notNull().default(0),
  isBanned: boolean("is_banned").notNull().default(false),
  isFlagged: boolean("is_flagged").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  usedMinutes: true,
  extraMinutes: true,
  isBanned: true,
  isFlagged: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Lab Entry Logs
export const labEntries = pgTable("lab_entries", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  registrationNumber: text("registration_number").notNull(),
  pcNumber: text("pc_number").notNull(),
  purpose: text("purpose").notNull(),
  time: text("time").notNull(),
  endTime: text("end_time"),
  actualEndTime: text("actual_end_time"),
  overtimeMinutes: integer("overtime_minutes").default(0),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertLabEntrySchema = createInsertSchema(labEntries).omit({
  id: true,
  timestamp: true,
  actualEndTime: true,
  overtimeMinutes: true,
});

export type InsertLabEntry = z.infer<typeof insertLabEntrySchema>;
export type LabEntry = typeof labEntries.$inferSelect;

// Settings Table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
