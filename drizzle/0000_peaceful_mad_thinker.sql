CREATE TABLE `notification_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`client_hash` text NOT NULL,
	`partition` text DEFAULT 'general' NOT NULL,
	`offer_id` text NOT NULL,
	`name` text NOT NULL,
	`channel` text NOT NULL,
	`destination_hash` text NOT NULL,
	`masked_destination` text NOT NULL,
	`max_price` integer NOT NULL,
	`crowd_below` integer NOT NULL,
	`events_json` text NOT NULL,
	`consented_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`disabled_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_active_unique` ON `notification_subscriptions` (`client_hash`,`partition`,`offer_id`);--> statement-breakpoint
CREATE INDEX `notification_client_idx` ON `notification_subscriptions` (`client_hash`,`disabled_at`);