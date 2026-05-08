
SELECT cron.schedule(
  'reminder-instance-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rndunloczfpfbubuwffb.supabase.co/functions/v1/reminder-instance-tick',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZHVubG9jemZwZmJ1YnV3ZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDEyMjIsImV4cCI6MjA3NDcxNzIyMn0.DsiQcXrQKHVg1WDJjJ2aAuABv5O7KLd6-7lKxmKcDCM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
