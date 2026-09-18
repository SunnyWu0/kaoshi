CREATE TABLE `invites` (`token` text PRIMARY KEY NOT NULL, `created_by` integer NOT NULL, `expires_at` integer NOT NULL, `used_at` integer);
