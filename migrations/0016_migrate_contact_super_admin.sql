UPDATE "users"
SET "email" = 'contact@sebastienj.com'
WHERE lower("email") = 'seb@tellthem.be'
  AND NOT EXISTS (
    SELECT 1 FROM "users" AS "contact_user"
    WHERE lower("contact_user"."email") = 'contact@sebastienj.com'
  );
--> statement-breakpoint
UPDATE "users"
SET "platform_role" = 'super_admin'
WHERE lower("email") = 'contact@sebastienj.com';
