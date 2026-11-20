// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
// All business collections commit atomically; version prevents lost updates.
export const centerState = sqliteTable("center_state", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  version: integer("version").notNull().default(1),
});
