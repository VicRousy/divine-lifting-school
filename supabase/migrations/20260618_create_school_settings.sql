CREATE TABLE IF NOT EXISTS public.school_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  school_name TEXT DEFAULT 'Divine Lifting School',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  motto TEXT DEFAULT 'Excellence in Education',
  logo_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Insert default row
INSERT INTO public.school_settings (id, school_name) VALUES (1, 'Divine Lifting School')
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read
CREATE POLICY "school_settings_read" ON public.school_settings FOR SELECT USING (true);

-- Allow admins to update
CREATE POLICY "school_settings_admin_all" ON public.school_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
