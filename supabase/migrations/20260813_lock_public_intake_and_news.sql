-- Close legacy public policies after the website forms moved to Vercel functions.
-- Apply with: node scripts/apply-migration.js supabase/migrations/20260813_lock_public_intake_and_news.sql

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON public.contact_messages FROM anon;
REVOKE ALL ON public.applications FROM anon;
REVOKE ALL ON public.public_news FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_application_number() FROM anon, authenticated;

GRANT SELECT ON public.public_news TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_news TO authenticated;

DROP POLICY IF EXISTS "Public can read public_news" ON public.public_news;
DROP POLICY IF EXISTS "Public can insert public_news" ON public.public_news;
DROP POLICY IF EXISTS "Public can update public_news" ON public.public_news;
DROP POLICY IF EXISTS "Public can delete public_news" ON public.public_news;
DROP POLICY IF EXISTS "Anyone can insert contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public can read contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public can update contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public can delete contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
DROP POLICY IF EXISTS "Portal can read applications" ON public.applications;
DROP POLICY IF EXISTS "Portal can update applications" ON public.applications;
DROP POLICY IF EXISTS "cm_insert_anon" ON public.contact_messages;
DROP POLICY IF EXISTS "cm_admin_all" ON public.contact_messages;
DROP POLICY IF EXISTS "app_insert_anon" ON public.applications;
DROP POLICY IF EXISTS "app_admin_all" ON public.applications;
DROP POLICY IF EXISTS "news_auth_read" ON public.public_news;
DROP POLICY IF EXISTS "news_admin_all" ON public.public_news;

CREATE POLICY "contact_messages_admin_only"
  ON public.contact_messages FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "applications_admin_only"
  ON public.applications FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "public_news_public_read"
  ON public.public_news FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_news_admin_write"
  ON public.public_news FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "public_news_admin_update"
  ON public.public_news FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "public_news_admin_delete"
  ON public.public_news FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Public can view news_images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload news_images" ON storage.objects;
DROP POLICY IF EXISTS "Public can update news_images" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete news_images" ON storage.objects;

CREATE POLICY "news_images_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'news_images');

CREATE POLICY "news_images_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'news_images' AND public.is_admin());

CREATE POLICY "news_images_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'news_images' AND public.is_admin())
  WITH CHECK (bucket_id = 'news_images' AND public.is_admin());

CREATE POLICY "news_images_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'news_images' AND public.is_admin());
