CREATE TABLE "track_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"category_id" uuid,
	"name" text DEFAULT 'Nouveau groupe' NOT NULL,
	"color" text DEFAULT '#8b5cf6' NOT NULL,
	"position" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "subcategory_id" uuid;--> statement-breakpoint
ALTER TABLE "track_subcategories" ADD CONSTRAINT "track_subcategories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_subcategories" ADD CONSTRAINT "track_subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "track_subcategories_project_id_idx" ON "track_subcategories" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "track_subcategories_category_id_idx" ON "track_subcategories" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_subcategory_id_track_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."track_subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracks_subcategory_id_idx" ON "tracks" USING btree ("subcategory_id");