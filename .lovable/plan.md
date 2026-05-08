
# Custom Snooze System — Full Build Plan

A reminder-instance architecture so snoozing never mutates the master task/routine schedule, with a native Android transparent dialog that lets users snooze straight from the notification (no full app launch), realtime cross-device sync, offline-first queue, and an adaptive intelligence layer that reorders presets based on personal usage.

## 1. Database (Supabase migration)

New tables:

- `reminder_instances`
  - `id`, `user_id`, `reminder_type` ('task' | 'routine_step'), `reminder_id` (uuid of source task/routine_task_slot), `scheduled_for` (timestamptz, UTC), `snoozed_until` (timestamptz, nullable), `state` ('pending'|'snoozed'|'completed'|'expired'|'dismissed'), `snooze_count` (int, default 0), `completed_at`, `device_origin`, `timezone`, `created_at`, `updated_at`
  - Indexes on `(user_id, state)`, `(scheduled_for)`, `(snoozed_until)`
  - RLS: user owns rows by `user_id`

- `snooze_usage` (intelligence layer)
  - `id`, `user_id`, `duration_minutes`, `used_count`, `last_used_at`
  - Unique `(user_id, duration_minutes)`
  - RLS: user owns rows

- `snooze_sync_queue` (offline reconciliation, optional thin table)
  - `id`, `user_id`, `instance_id`, `action` ('snooze'|'complete'|'dismiss'), `payload jsonb`, `client_event_at`, `processed` bool

Realtime publication enabled on `reminder_instances`.

## 2. Edge functions

- `reminder-instance-snooze` — accepts `{ instance_id, snooze_minutes, client_event_at, device_id }`, validates JWT, computes `snoozed_until = now + minutes`, updates instance to `state='snoozed'`, increments `snooze_count`, upserts `snooze_usage`, returns next trigger time. Idempotent on `client_event_at`.
- `reminder-instance-complete` — marks instance `completed`, mirrors completion to source `tasks.status` (only for one-time tasks; routine recurrence untouched).
- `reminder-instance-dismiss` — soft dismiss; state to `dismissed`.
- `reminder-instance-tick` (cron, every minute) — materializes upcoming task + routine occurrences into `reminder_instances`, expires stale snoozes, fires OneSignal pushes for any instance whose effective trigger time has passed and is still `pending`/`snoozed→due`. Sends with action buttons (`COMPLETE`, `SNOOZE`) and `instance_id` in custom data.

Existing `task-two-hour-reminder`, `routine-step-reminder` are refactored to delegate to instance creation rather than firing notifications directly. Master schedules and recurrence rules are never mutated by snooze.

Cron schedule registered via SQL (pg_cron + pg_net) every minute.

## 3. OneSignal payload shape

All reminder pushes include:
```
data: {
  kind: 'reminder',
  instance_id, reminder_type, reminder_id,
  title, body, scheduled_for
}
buttons: [
  { id: 'COMPLETE', text: 'Complete' },
  { id: 'SNOOZE',   text: 'Snooze'   }
]
```

## 4. Native Android (no app launch on snooze)

In `android/app/src/main/java/com/vansh/remonkreminder/`:

- `MainMessagingService.java` — intercept FCM/OneSignal payloads, build a high-priority notification with two `PendingIntent` action buttons pointing at a new `BroadcastReceiver`.
- `NotificationActionReceiver.java` (new) — handles `COMPLETE` (calls edge function via authenticated HTTPS using stored JWT, dismisses notification) and `SNOOZE` (launches `SnoozeDialogActivity` with `FLAG_ACTIVITY_NEW_TASK | NO_HISTORY`, theme `@android:style/Theme.Translucent.NoTitleBar`).
- `SnoozeDialogActivity.java` (new) — transparent activity rendering a compact dialog: preset chips (5/15/30/60/Tonight/Tomorrow morning) sorted by user's `snooze_usage`, a custom input row (number + unit dropdown: min/hr/day/week), live "Snoozed until HH:MM" preview, Confirm button. Submits to `reminder-instance-snooze` edge function, dismisses notification, finishes activity. Soft haptic on selection.
- Stored auth: read Supabase JWT from `SharedPreferences` (written from JS via a small Capacitor plugin shim — see step 5).
- `AndroidManifest.xml` — register `NotificationActionReceiver`, `SnoozeDialogActivity` (translucent, excludeFromRecents, noHistory), POST_NOTIFICATIONS perm already present.

iOS placeholder: same OneSignal action button IDs are sent; iOS-side category/handler implementation deferred but the data contract is identical.

## 5. JS ↔ Native bridge

- `src/lib/snoozeBridge.ts` — on auth state change, persists current `access_token`, `refresh_token`, `user_id`, `supabase_url`, `supabase_anon_key` into `Preferences` (`@capacitor/preferences`) under namespace `remonk.auth`. Native side reads the same keys.
- Web fallback (no native dialog available): tapping notification opens an in-app `<SnoozeSheet>` route as graceful degradation.

## 6. React layer

New files:
- `src/utils/snoozeEngine.ts` — pure functions: `computeNextTrigger`, `formatSnoozePreview`, `getOrderedPresets(usage)`.
- `src/hooks/useReminderInstances.tsx` — subscribes to `reminder_instances` realtime, exposes `snooze`, `complete`, `dismiss` with optimistic updates and an offline queue (IndexedDB via existing `offlineStorage.ts` extended with `pendingSnoozes` store).
- `src/hooks/useSnoozeIntelligence.tsx` — reads `snooze_usage`, returns ordered preset list.
- `src/components/snooze/SnoozeSheet.tsx` — bottom sheet with preset chips, custom duration row (number input + unit Select), live preview, Confirm/Cancel. Used as the in-app surface and as the web fallback.
- `src/components/snooze/SnoozeChip.tsx` — small reusable chip.
- `src/pages/SnoozeRoute.tsx` (route `/snooze/:instanceId`) — wraps `SnoozeSheet` for the deep-link/web fallback path.

UI integration:
- `TaskCard` / `RoutineCard` get a "Snooze" affordance that opens `SnoozeSheet` for the active instance.
- Notifications page lists active `reminder_instances` with state.

## 7. Sync, offline, edge cases

- Realtime subscription on `reminder_instances` updates UI everywhere; when one device snoozes/completes, others receive the update and OneSignal cancels via `instance_id` tag (server-side cancel call in the snooze/complete edge functions).
- Offline: action queued locally with `client_event_at`; reconciled on reconnect; server resolves conflicts by `max(client_event_at)`.
- Timezone/DST: all storage UTC; presentation via `date-fns-tz` and user's `profiles.timezone`. "Tomorrow morning" = next 09:00 local; "Tonight" = today 21:00 local (or +1h if already past).
- Reboot: Android `BOOT_COMPLETED` not needed because snoozes are server-driven (cron re-fires).
- Missed reminders: `tick` function fires once per missed window, never floods.
- Recurrence safety: routine snooze writes only to its `reminder_instances` row; `routine_task_slots` untouched.

## 8. Intelligence layer

Each successful snooze increments `snooze_usage(user_id, duration_minutes)`. `getOrderedPresets` merges defaults `[5,15,30,60, tonight, tomorrow_morning]` with the user's top-3 custom durations (>= 2 uses) and de-dupes, capping at 6 chips. Most-used surfaces first.

## 9. Future extensibility hooks

Instance schema includes `metadata jsonb` for later AI/contextual/location payloads. Snooze edge function accepts an optional `source` field ('manual'|'ai'|'voice'|'location') for future analytics.

## Files to create

- migration (instances + usage + queue + cron)
- `supabase/functions/reminder-instance-snooze/index.ts`
- `supabase/functions/reminder-instance-complete/index.ts`
- `supabase/functions/reminder-instance-dismiss/index.ts`
- `supabase/functions/reminder-instance-tick/index.ts`
- `android/app/src/main/java/com/vansh/remonkreminder/NotificationActionReceiver.java`
- `android/app/src/main/java/com/vansh/remonkreminder/SnoozeDialogActivity.java`
- `android/app/src/main/res/layout/dialog_snooze.xml`
- `src/lib/snoozeBridge.ts`
- `src/utils/snoozeEngine.ts`
- `src/hooks/useReminderInstances.tsx`
- `src/hooks/useSnoozeIntelligence.tsx`
- `src/components/snooze/SnoozeSheet.tsx`
- `src/components/snooze/SnoozeChip.tsx`
- `src/pages/SnoozeRoute.tsx`

## Files to edit

- `android/app/src/main/java/com/vansh/remonkreminder/MainMessagingService.java` (action buttons, data passthrough)
- `android/app/src/main/AndroidManifest.xml` (register receiver + activity)
- `src/App.tsx` (mount route + bridge)
- `src/utils/offlineStorage.ts` (pendingSnoozes store)
- `src/components/tasks/TaskCard.tsx` and `src/components/routines/RoutineCard.tsx` (snooze affordance)
- existing `task-two-hour-reminder`, `routine-step-reminder` edge functions (delegate to instances)
- `src/hooks/useAuth.tsx` (write JWT to Preferences for native bridge)

## Out of scope this pass

- iOS native dialog handler (data contract ready; native impl deferred)
- Voice / location / calendar-aware snooze (schema ready, no UI)
