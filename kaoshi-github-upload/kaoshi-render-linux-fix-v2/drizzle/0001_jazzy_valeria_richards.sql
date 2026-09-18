ALTER TABLE `attempts` ADD `auto_score` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` ADD `manual_score` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` ADD `grading_status` text DEFAULT 'graded' NOT NULL;