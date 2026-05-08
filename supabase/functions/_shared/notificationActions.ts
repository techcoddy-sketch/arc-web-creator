import type { NotificationButton } from './types.ts';

export type ReminderKind =
  | 'task'
  | 'document'
  | 'routine_step'
  | 'task_bulk'
  | 'generic';

/**
 * Standard "Notification-First" action buttons.
 * OneSignal renders up to 3 buttons on Android — we always ship the same
 * 3 so the experience feels consistent everywhere.
 */
export function getReminderButtons(kind: ReminderKind): NotificationButton[] {
  if (kind === 'task_bulk' || kind === 'generic') {
    // Bulk / generic notifications can't be acted on as a single entity —
    // show only "More" so the user can open the app.
    return [{ id: 'open_app', text: 'Open' }];
  }

  return [
    { id: 'complete', text: '✓ Done' },
    { id: 'snooze_1h', text: '💤 Snooze 1h' },
    { id: 'more', text: '⏰ More' },
  ];
}
