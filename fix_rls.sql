-- Run this in Supabase SQL Editor
-- Grants table permissions and ensures RLS is off

ALTER TABLE public.public_news DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.public_news TO anon, authenticated, service_role;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Storage grants
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
