UPDATE "categories" SET "color" = '#22d3b6' WHERE lower("color") = '#f97316';
--> statement-breakpoint
UPDATE "playlists" SET "color" = '#22d3b6' WHERE lower("color") = '#f97316';
--> statement-breakpoint
UPDATE "tracks" SET "color" = '#22d3b6' WHERE lower("color") = '#f97316';
--> statement-breakpoint
DELETE FROM "project_colors" AS "old_color"
WHERE lower("old_color"."color") = '#f97316'
AND EXISTS (
  SELECT 1 FROM "project_colors" AS "new_color"
  WHERE "new_color"."project_id" = "old_color"."project_id"
  AND lower("new_color"."color") = '#22d3b6'
);
--> statement-breakpoint
UPDATE "project_colors" SET "color" = '#22d3b6' WHERE lower("color") = '#f97316';
