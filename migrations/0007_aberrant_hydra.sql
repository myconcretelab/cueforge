CREATE TABLE "project_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"color" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_colors" ADD CONSTRAINT "project_colors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_colors_project_id_idx" ON "project_colors" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_colors_project_color_idx" ON "project_colors" USING btree ("project_id","color");--> statement-breakpoint
INSERT INTO "project_colors" ("project_id", "color", "position")
SELECT "projects"."id", "palette"."color", "palette"."position"
FROM "projects"
CROSS JOIN (VALUES
	('#f97316', 0),
	('#f59e0b', 1),
	('#eab308', 2),
	('#84cc16', 3),
	('#22c55e', 4),
	('#14b8a6', 5),
	('#06b6d4', 6),
	('#3b82f6', 7),
	('#6366f1', 8),
	('#8b5cf6', 9),
	('#ec4899', 10),
	('#f43f5e', 11)
) AS "palette" ("color", "position")
WHERE lower(trim("projects"."name")) IN ('impro', 'impro !')
	AND NOT EXISTS (
		SELECT 1 FROM "project_colors" WHERE "project_colors"."project_id" = "projects"."id"
	);
