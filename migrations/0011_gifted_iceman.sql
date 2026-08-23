ALTER TABLE "playlists" ADD COLUMN "category_id" uuid;--> statement-breakpoint
UPDATE "playlists" AS "playlist"
SET "category_id" = COALESCE(
	(
		SELECT "track"."category_id"
		FROM "playlist_items" AS "item"
		INNER JOIN "tracks" AS "track" ON "track"."id" = "item"."track_id"
		WHERE "item"."playlist_id" = "playlist"."id" AND "track"."category_id" IS NOT NULL
		ORDER BY "item"."position"
		LIMIT 1
	),
	(
		SELECT "category"."id"
		FROM "categories" AS "category"
		WHERE "category"."project_id" = "playlist"."project_id"
		ORDER BY "category"."position"
		LIMIT 1
	)
);--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "playlists_category_id_idx" ON "playlists" USING btree ("category_id");
