import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const messages = pgTable("messages", {
  id: serial().primaryKey(),
  message: text().notNull(),
  verdict: text().notNull(),
  score: integer().notNull(),
  reason: text().notNull().default(""),
  ip: text(),
  country: text(),
  city: text(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});
