
-- Reminder instances: per-occurrence state, never mutates master schedule
CREATE TABLE public.reminder_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('task','routine_step')),
  reminder_id uuid NOT NULL,
  scheduled_for timestamptz NOT NULL,
  snoozed_until timestamptz,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','snoozed','completed','expired','dismissed','fired')),
  snooze_count integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  fired_at timestamptz,
  device_origin text,
  timezone text NOT NULL DEFAULT 'UTC',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reminder_type, reminder_id, scheduled_for)
);

CREATE INDEX idx_reminder_instances_user_state ON public.reminder_instances(user_id, state);
CREATE INDEX idx_reminder_instances_scheduled ON public.reminder_instances(scheduled_for);
CREATE INDEX idx_reminder_instances_snoozed ON public.reminder_instances(snoozed_until) WHERE snoozed_until IS NOT NULL;

ALTER TABLE public.reminder_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own instances" ON public.reminder_instances
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own instances" ON public.reminder_instances
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own instances" ON public.reminder_instances
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own instances" ON public.reminder_instances
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_reminder_instances_updated
  BEFORE UPDATE ON public.reminder_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.reminder_instances;
ALTER TABLE public.reminder_instances REPLICA IDENTITY FULL;

-- Snooze usage: intelligence layer
CREATE TABLE public.snooze_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  duration_minutes integer NOT NULL,
  used_count integer NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, duration_minutes)
);

CREATE INDEX idx_snooze_usage_user ON public.snooze_usage(user_id, used_count DESC);

ALTER TABLE public.snooze_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own snooze usage" ON public.snooze_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own snooze usage" ON public.snooze_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own snooze usage" ON public.snooze_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER trg_snooze_usage_updated
  BEFORE UPDATE ON public.snooze_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Offline reconciliation queue (server-side audit of client-queued actions)
CREATE TABLE public.snooze_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  instance_id uuid,
  action text NOT NULL CHECK (action IN ('snooze','complete','dismiss')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_event_at timestamptz NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_snooze_sync_user_unprocessed ON public.snooze_sync_queue(user_id, processed);

ALTER TABLE public.snooze_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own queue" ON public.snooze_sync_queue
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own queue" ON public.snooze_sync_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable extensions for cron + http
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
