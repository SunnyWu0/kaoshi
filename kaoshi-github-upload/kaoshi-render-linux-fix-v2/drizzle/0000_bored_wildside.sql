CREATE TABLE `attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exam_id` integer NOT NULL,
	`candidate_name` text NOT NULL,
	`answers_json` text NOT NULL,
	`score` integer NOT NULL,
	`total_score` integer NOT NULL,
	`correct_count` integer NOT NULL,
	`submitted_at` integer NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_exam_submitted` ON `attempts` (`exam_id`,`submitted_at`);--> statement-breakpoint
CREATE TABLE `exams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`admin_key` text NOT NULL,
	`title` text NOT NULL,
	`questions_json` text NOT NULL,
	`duration_minutes` integer DEFAULT 30 NOT NULL,
	`source_file_key` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exams_code_unique` ON `exams` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `exams_admin_key_unique` ON `exams` (`admin_key`);