CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"storage_quota_bytes" bigint NOT NULL,
	"monthly_price_cents" integer,
	"annual_price_cents" integer,
	"trial_days" integer DEFAULT 14 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"status" text DEFAULT 'none' NOT NULL,
	"billing_interval" text,
	"current_period_starts_at" timestamp with time zone,
	"current_period_ends_at" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "plans" ("code", "name", "description", "storage_quota_bytes", "trial_days", "is_default", "active")
VALUES ('solo', 'Solo', 'Forfait individuel SonoRiva.', 5368709120, 14, true, true);
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "plan_code" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "access_status" text DEFAULT 'trialing' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "storage_quota_override_bytes" bigint;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "platform_role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
UPDATE "accounts" SET "plan_code" = 'solo';--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_account_id_idx" ON "subscriptions" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_provider_subscription_id_idx" ON "subscriptions" USING btree ("provider","provider_subscription_id");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_plan_code_plans_code_fk" FOREIGN KEY ("plan_code") REFERENCES "public"."plans"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "subscription_status";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "storage_quota_bytes";
