CREATE TABLE `team_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_lead` text NOT NULL,
	`team` text NOT NULL,
	`period` text NOT NULL,
	`completed_tasks` text NOT NULL,
	`current_state` text NOT NULL,
	`blockers` text DEFAULT '' NOT NULL,
	`next_steps` text DEFAULT '' NOT NULL,
	`completion_percent` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'В работе' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
