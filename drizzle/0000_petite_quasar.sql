CREATE TABLE `presence` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`room` text NOT NULL,
	`name` text NOT NULL,
	`x` real NOT NULL,
	`z` real NOT NULL,
	`yaw` real DEFAULT 0 NOT NULL,
	`pose` text DEFAULT 'idle' NOT NULL,
	`seat` text,
	`seq` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	`joined_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `presence_room_time` ON `presence` (`room`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `presence_room_seat` ON `presence` (`room`,`seat`);