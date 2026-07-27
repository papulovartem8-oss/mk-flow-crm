CREATE TABLE `crm_leads` (
	`id` integer PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
