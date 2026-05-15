
DO $$
DECLARE
  service_jwt text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZHVubG9jemZwZmJ1YnV3ZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE0MTIyMiwiZXhwIjoyMDc0NzE3MjIyfQ.bIqcOjRLsVd7rV_HMR2fSx6RDyNaTHZ-Bb5I7sGrZXc';
  base_url text := 'https://rndunloczfpfbubuwffb.supabase.co/functions/v1/';
  jobs jsonb := '[
    {"name":"task-two-hour-reminder","fn":"task-two-hour-reminder","sched":"*/5 * * * *"},
    {"name":"task-incomplete-reminder","fn":"task-incomplete-reminder","sched":"0 * * * *"},
    {"name":"routine-step-reminder","fn":"routine-step-reminder","sched":"*/5 * * * *"},
    {"name":"task-carry-forward","fn":"task-carry-forward","sched":"0 * * * *"},
    {"name":"document-reminder-hourly","fn":"document-reminder","sched":"0 * * * *"},
    {"name":"timezone-notification-scheduler-hourly","fn":"timezone-notification-scheduler","sched":"0 * * * *"}
  ]'::jsonb;
  job jsonb;
BEGIN
  FOR job IN SELECT * FROM jsonb_array_elements(jobs) LOOP
    PERFORM cron.unschedule((job->>'name'));
    PERFORM cron.schedule(
      (job->>'name'),
      (job->>'sched'),
      format(
        $f$ SELECT net.http_post(
              url := %L,
              headers := %L::jsonb,
              body := '{}'::jsonb
            ) AS request_id; $f$,
        base_url || (job->>'fn'),
        json_build_object(
          'Content-Type','application/json',
          'Authorization','Bearer ' || service_jwt
        )::text
      )
    );
  END LOOP;
END $$;
