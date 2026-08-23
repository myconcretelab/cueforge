ALTER TABLE "projects" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH ranked_projects AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "owner_id" ORDER BY "created_at", "id") - 1 AS next_position
  FROM "projects"
)
UPDATE "projects"
SET "position" = ranked_projects.next_position
FROM ranked_projects
WHERE "projects"."id" = ranked_projects."id";
