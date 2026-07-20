import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const notificationSubscriptions = sqliteTable("notification_subscriptions", {
  id: text("id").primaryKey(),
  clientHash: text("client_hash").notNull(),
  partition: text("partition", { enum: ["general", "mature"] }).notNull().default("general"),
  offerId: text("offer_id").notNull(),
  name: text("name").notNull(),
  channel: text("channel", { enum: ["email", "web_push"] }).notNull(),
  destinationHash: text("destination_hash").notNull(),
  maskedDestination: text("masked_destination").notNull(),
  maxPrice: integer("max_price").notNull(),
  crowdBelow: integer("crowd_below").notNull(),
  eventsJson: text("events_json").notNull(),
  consentedAt: text("consented_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  disabledAt: text("disabled_at"),
}, (table) => [
  uniqueIndex("notification_active_unique").on(table.clientHash, table.partition, table.offerId),
  index("notification_client_idx").on(table.clientHash, table.disabledAt),
]);
