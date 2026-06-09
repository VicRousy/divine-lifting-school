-- Grade Scale table — single-row config for grade boundaries
CREATE TABLE IF NOT EXISTS public.grade_scale (
  id BIGINT PRIMARY KEY DEFAULT 1,
  scale JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.grade_scale ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read grade_scale" ON public.grade_scale;
CREATE POLICY "Anyone can read grade_scale"
  ON public.grade_scale FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert grade_scale" ON public.grade_scale;
CREATE POLICY "Anyone can insert grade_scale"
  ON public.grade_scale FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update grade_scale" ON public.grade_scale;
CREATE POLICY "Anyone can update grade_scale"
  ON public.grade_scale FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Insert default scale if not exists
INSERT INTO public.grade_scale (id, scale)
SELECT 1, '[
  {"min": 80, "max": 100, "grade": "A+", "remark": "Excellent", "color": "#10b981"},
  {"min": 70, "max": 79, "grade": "A", "remark": "Very Good", "color": "#34d399"},
  {"min": 60, "max": 69, "grade": "B", "remark": "Good", "color": "#38bdf8"},
  {"min": 50, "max": 59, "grade": "C", "remark": "Satisfactory", "color": "#f59e0b"},
  {"min": 40, "max": 49, "grade": "D", "remark": "Pass", "color": "#fbbf24"},
  {"min": 0, "max": 39, "grade": "F", "remark": "Fail", "color": "#ef4444"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.grade_scale WHERE id = 1);
