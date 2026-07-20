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
  destinationCiphertext: text("destination_ciphertext"),
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

export const notificationOutbox = sqliteTable("notification_outbox", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").notNull().references(() => notificationSubscriptions.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url").notNull(),
  dedupeKey: text("dedupe_key").notNull(),
  status: text("status", { enum: ["pending", "processing", "sent", "failed"] }).notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  availableAt: text("available_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  providerMessageId: text("provider_message_id"),
  lastError: text("last_error"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  sentAt: text("sent_at"),
}, (table) => [
  uniqueIndex("notification_outbox_dedupe_unique").on(table.subscriptionId, table.dedupeKey),
  index("notification_outbox_delivery_idx").on(table.status, table.availableAt),
]);
