CREATE INDEX "categories_project_id_idx" ON "categories" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_owner_id_idx" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tracks_project_id_idx" ON "tracks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tracks_category_id_idx" ON "tracks" USING btree ("category_id");