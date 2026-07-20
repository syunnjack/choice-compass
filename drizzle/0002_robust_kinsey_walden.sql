CREATE TABLE `saved_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`purpose` text NOT NULL,
	`pace` text NOT NULL,
	`budget` text NOT NULL,
	`items_json` text NOT NULL,
	`checked_json` text NOT NULL,
	`consent` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `saved_plans_email_idx` ON `saved_plans` (`email`,`created_at`);