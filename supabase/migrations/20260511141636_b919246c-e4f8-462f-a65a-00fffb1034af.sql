
CREATE TABLE IF NOT EXISTS public.learned_preferences (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learned_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own learned prefs" ON public.learned_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own learned prefs" ON public.learned_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own learned prefs" ON public.learned_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own learned prefs" ON public.learned_preferences
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_learned_preferences_updated_at
  BEFORE UPDATE ON public.learned_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
