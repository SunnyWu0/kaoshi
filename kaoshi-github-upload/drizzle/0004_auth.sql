CREATE TABLE `users` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `email` text NOT NULL UNIQUE, `password_hash` text NOT NULL, `role` text DEFAULT 'member' NOT NULL, `created_at` integer NOT NULL);
CREATE TABLE `sessions` (`token` text PRIMARY KEY NOT NULL, `user_id` integer NOT NULL, `expires_at` integer NOT NULL);
ALTER TABLE `exams` ADD `owner_id` integer;
