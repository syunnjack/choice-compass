CREATE TABLE `notification_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`event_type` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`action_url` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`provider_message_id` text,
	`last_error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`sent_at` text,
	FOREIGN KEY (`subscription_id`) REFERENCES `notification_subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_outbox_dedupe_unique` ON `notification_outbox` (`subscription_id`,`dedupe_key`);--> statement-breakpoint
CREATE INDEX `notification_outbox_delivery_idx` ON `notification_outbox` (`status`,`available_at`);--> statement-breakpoint
ALTER TABLE `notification_subscriptions` ADD `destination_ciphertext` text;