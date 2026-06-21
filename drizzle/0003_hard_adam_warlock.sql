CREATE TABLE "server_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"cpu_pct" real NOT NULL,
	"ram_pct" real NOT NULL,
	"disk_pct" real NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
