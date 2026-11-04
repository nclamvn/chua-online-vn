CREATE TABLE `offering_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`request_id` text NOT NULL,
	`room` text NOT NULL,
	`kind` text NOT NULL,
	`day` text NOT NULL,
	`slot` integer NOT NULL,
	`status` text DEFAULT 'saved_demo' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `offering_receipts_request_id_unique` ON `offering_receipts` (`request_id`);--> statement-breakpoint
CREATE INDEX `offering_owner_time` ON `offering_receipts` (`owner_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `offering_schedule` ON `offering_receipts` (`day`,`slot`,`status`);--> statement-breakpoint
ALTER TABLE `presence` ADD `appearance` text DEFAULT '{}' NOT NULL;