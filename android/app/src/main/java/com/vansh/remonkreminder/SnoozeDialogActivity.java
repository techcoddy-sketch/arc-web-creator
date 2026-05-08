package com.vansh.remonkreminder;

import android.app.Activity;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.content.Context;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Transparent activity that shows a compact snooze chooser without launching
 * the full app. Confirms by calling reminder-instance-snooze edge function.
 */
public class SnoozeDialogActivity extends Activity {
    private String instanceId;
    private String title;
    private int selectedMinutes = 0;

    private TextView previewText;

    private static final int[] PRESET_MINUTES = { 5, 15, 30, 60 };
    private static final String[] PRESET_LABELS = { "5 min", "15 min", "30 min", "1 hour" };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_snooze);

        instanceId = getIntent().getStringExtra(NotificationActionReceiver.EXTRA_INSTANCE_ID);
        title = getIntent().getStringExtra(NotificationActionReceiver.EXTRA_TITLE);

        TextView header = findViewById(R.id.snooze_header);
        if (header != null && title != null) header.setText("Snooze: " + title);

        previewText = findViewById(R.id.snooze_preview);

        LinearLayout chipsRow = findViewById(R.id.snooze_chips);
        for (int i = 0; i < PRESET_MINUTES.length; i++) {
            final int mins = PRESET_MINUTES[i];
            Button b = new Button(this);
            b.setText(PRESET_LABELS[i]);
            b.setAllCaps(false);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 12, 0);
            b.setLayoutParams(lp);
            b.setOnClickListener(v -> {
                selectedMinutes = mins;
                haptic();
                updatePreview();
            });
            chipsRow.addView(b);
        }

        // Quick "Tonight" / "Tomorrow AM"
        Button tonight = findViewById(R.id.snooze_tonight);
        Button morning = findViewById(R.id.snooze_morning);
        tonight.setOnClickListener(v -> {
            selectedMinutes = minutesUntilLocalHour(21);
            haptic();
            updatePreview();
        });
        morning.setOnClickListener(v -> {
            selectedMinutes = minutesUntilTomorrowHour(9);
            haptic();
            updatePreview();
        });

        final EditText customValue = findViewById(R.id.snooze_custom_value);
        final Spinner unitSpinner = findViewById(R.id.snooze_custom_unit);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this,
                android.R.layout.simple_spinner_dropdown_item,
                new String[] { "minutes", "hours", "days", "weeks" });
        unitSpinner.setAdapter(adapter);

        Runnable recomputeCustom = () -> {
            String s = customValue.getText().toString().trim();
            if (s.isEmpty()) return;
            try {
                int n = Integer.parseInt(s);
                if (n <= 0) return;
                int factor;
                switch (unitSpinner.getSelectedItemPosition()) {
                    case 1: factor = 60; break;
                    case 2: factor = 60 * 24; break;
                    case 3: factor = 60 * 24 * 7; break;
                    default: factor = 1;
                }
                selectedMinutes = n * factor;
                updatePreview();
            } catch (NumberFormatException ignored) {}
        };
        customValue.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence c,int a,int b,int d){}
            @Override public void onTextChanged(CharSequence c,int a,int b,int d){ recomputeCustom.run(); }
            @Override public void afterTextChanged(Editable s){}
        });
        unitSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> p, View v, int pos, long id) { recomputeCustom.run(); }
            @Override public void onNothingSelected(AdapterView<?> p) {}
        });

        findViewById(R.id.snooze_cancel).setOnClickListener(v -> finish());
        findViewById(R.id.snooze_confirm).setOnClickListener(v -> confirm());
    }

    private void confirm() {
        if (selectedMinutes <= 0 || instanceId == null) {
            finish();
            return;
        }
        haptic();
        new NotificationActionReceiver.CallEdgeFunctionTask(
                getApplicationContext(),
                "reminder-instance-snooze",
                instanceId,
                selectedMinutes).execute();
        finish();
    }

    private void updatePreview() {
        if (previewText == null) return;
        if (selectedMinutes <= 0) {
            previewText.setText("Pick a duration");
            return;
        }
        long target = System.currentTimeMillis() + selectedMinutes * 60_000L;
        SimpleDateFormat sameDayFmt = new SimpleDateFormat("h:mm a", Locale.US);
        SimpleDateFormat dayFmt = new SimpleDateFormat("EEE, MMM d 'at' h:mm a", Locale.US);
        long todayStart = todayMidnight();
        long tomorrowStart = todayStart + 24 * 60 * 60_000L;
        Date d = new Date(target);
        if (target < tomorrowStart) {
            previewText.setText("Snoozed until " + sameDayFmt.format(d));
        } else {
            previewText.setText("Snoozed until " + dayFmt.format(d));
        }
    }

    private long todayMidnight() {
        java.util.Calendar c = java.util.Calendar.getInstance();
        c.set(java.util.Calendar.HOUR_OF_DAY, 0);
        c.set(java.util.Calendar.MINUTE, 0);
        c.set(java.util.Calendar.SECOND, 0);
        c.set(java.util.Calendar.MILLISECOND, 0);
        return c.getTimeInMillis();
    }

    private int minutesUntilLocalHour(int hour) {
        java.util.Calendar c = java.util.Calendar.getInstance();
        java.util.Calendar t = (java.util.Calendar) c.clone();
        t.set(java.util.Calendar.HOUR_OF_DAY, hour);
        t.set(java.util.Calendar.MINUTE, 0);
        t.set(java.util.Calendar.SECOND, 0);
        if (t.before(c)) t.add(java.util.Calendar.HOUR_OF_DAY, 1);
        long diff = t.getTimeInMillis() - c.getTimeInMillis();
        return Math.max(1, (int) (diff / 60_000L));
    }

    private int minutesUntilTomorrowHour(int hour) {
        java.util.Calendar c = java.util.Calendar.getInstance();
        java.util.Calendar t = (java.util.Calendar) c.clone();
        t.add(java.util.Calendar.DAY_OF_MONTH, 1);
        t.set(java.util.Calendar.HOUR_OF_DAY, hour);
        t.set(java.util.Calendar.MINUTE, 0);
        t.set(java.util.Calendar.SECOND, 0);
        long diff = t.getTimeInMillis() - c.getTimeInMillis();
        return Math.max(1, (int) (diff / 60_000L));
    }

    private void haptic() {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) return;
            if (android.os.Build.VERSION.SDK_INT >= 26) {
                v.vibrate(VibrationEffect.createOneShot(8, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                v.vibrate(8);
            }
        } catch (Exception ignored) {}
    }
}
