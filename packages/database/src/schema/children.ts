import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { childConditionEnum } from "./enums";

export const children = pgTable(
  "children",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    dateOfBirth: date("date_of_birth"),
    condition: childConditionEnum("condition").notNull(),
    communicationPreferences: jsonb("communication_preferences").$type<Record<string, unknown>>(),
    goals: jsonb("goals").$type<string[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("children_user_id_idx").on(table.userId),
  ]
);
