ALTER TABLE `exams` ADD `expected_candidates` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` ADD `result_token` text DEFAULT '' NOT NULL;
