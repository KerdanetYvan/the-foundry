ALTER TABLE "server_metrics" ADD COLUMN "ram_mb" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "server_metrics" ADD COLUMN "disk_gb" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "server_metrics" ADD COLUMN "mc_ram_mb" integer;