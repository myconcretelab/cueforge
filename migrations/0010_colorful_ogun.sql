ALTER TABLE "playlists" ALTER COLUMN "position" SET DATA TYPE real;--> statement-breakpoint
UPDATE "playlists" AS "playlist"
SET "position" = COALESCE((
	SELECT MAX("track"."position")::real + 1
	FROM "tracks" AS "track"
	WHERE "track"."project_id" = "playlist"."project_id"
), 0) + "playlist"."position";
