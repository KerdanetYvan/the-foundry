ALTER TABLE "players" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "players_uuid_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "players_username_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "players_invitation_id_invitations_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(10) DEFAULT 'player' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "uuid";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");