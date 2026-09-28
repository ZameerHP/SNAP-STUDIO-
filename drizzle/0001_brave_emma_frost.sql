CREATE TABLE `square_checkouts` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`paid_before` integer NOT NULL,
	`request_json` text NOT NULL,
	`link_id` text,
	`order_id` text,
	`url` text,
	`status` text DEFAULT 'creating' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `square_checkouts_invoice` ON `square_checkouts` (`invoice_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `square_checkouts_order` ON `square_checkouts` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `square_checkouts_link` ON `square_checkouts` (`link_id`);