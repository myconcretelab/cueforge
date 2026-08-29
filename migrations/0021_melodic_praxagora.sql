CREATE TABLE "bridge_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"token_hash" text NOT NULL,
	"last_seen_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bridge_devices_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "bridge_pairing_tickets" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claimed_at" timestamp with time zone,
	"claimed_device_id" uuid,
	"local_token" text,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bridge_devices" ADD CONSTRAINT "bridge_devices_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridge_pairing_tickets" ADD CONSTRAINT "bridge_pairing_tickets_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridge_pairing_tickets" ADD CONSTRAINT "bridge_pairing_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bridge_pairing_tickets" ADD CONSTRAINT "bridge_pairing_tickets_claimed_device_id_bridge_devices_id_fk" FOREIGN KEY ("claimed_device_id") REFERENCES "public"."bridge_devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bridge_devices_account_id_idx" ON "bridge_devices" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "bridge_devices_token_hash_idx" ON "bridge_devices" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "bridge_pairing_tickets_account_id_idx" ON "bridge_pairing_tickets" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "bridge_pairing_tickets_expires_at_idx" ON "bridge_pairing_tickets" USING btree ("expires_at");