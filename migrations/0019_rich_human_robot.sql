CREATE TABLE "billing_events" (
	"provider_event_id" text PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"type" text NOT NULL,
	"livemode" boolean NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"last_error" text,
	"provider_created_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "billing_price_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_code" text NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"environment" text NOT NULL,
	"billing_interval" text NOT NULL,
	"provider_product_id" text NOT NULL,
	"provider_price_id" text NOT NULL,
	"currency" text DEFAULT 'eur' NOT NULL,
	"unit_amount_cents" integer NOT NULL,
	"active_for_sales" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "trial_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "provider_price_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "last_provider_event_created_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "last_provider_event_id" text;--> statement-breakpoint
ALTER TABLE "billing_price_mappings" ADD CONSTRAINT "billing_price_mappings_plan_code_plans_code_fk" FOREIGN KEY ("plan_code") REFERENCES "public"."plans"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_events_status_idx" ON "billing_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "billing_events_received_at_idx" ON "billing_events" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_price_mappings_provider_price_idx" ON "billing_price_mappings" USING btree ("provider","provider_price_id");--> statement-breakpoint
CREATE INDEX "billing_price_mappings_plan_interval_idx" ON "billing_price_mappings" USING btree ("plan_code","environment","billing_interval","active_for_sales");