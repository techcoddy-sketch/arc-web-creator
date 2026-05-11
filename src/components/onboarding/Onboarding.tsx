import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Bell,
  BellRing,
  Clock,
  Palette,
  RefreshCw,
  CheckCircle2,
  PartyPopper,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useOnboarding, type OnboardingPreferences } from "@/hooks/useOnboarding";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "light", label: "Light", swatch: "bg-[hsl(40,25%,97%)] border-foreground/10" },
  { id: "dark", label: "Dark", swatch: "bg-[hsl(220,20%,10%)] border-white/10" },
  { id: "system", label: "System", swatch: "bg-gradient-to-br from-[hsl(40,25%,97%)] to-[hsl(220,20%,10%)] border-foreground/10" },
];

const SNOOZE_OPTIONS = [10, 15, 30, 60];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", useDark);
}

export default function Onboarding() {
  const { showOnboarding, finish } = useOnboarding();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState<Theme>("system");
  const [snooze, setSnooze] = useState<number>(15);
  const [notifGranted, setNotifGranted] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [demoSnoozed, setDemoSnoozed] = useState<number | null>(null);
  const [firstReminder, setFirstReminder] = useState("Take a 5-minute break");
  const [firstTime, setFirstTime] = useState(() => {
    const t = new Date(Date.now() + 30 * 60_000);
    return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  });
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(
    () => [
      "welcome",
      "account",
      "notifications",
      "demo",
      "snooze",
      "theme",
      "sync",
      "first-reminder",
      "finish",
    ] as const,
    []
  );
  const total = steps.length;
  const current = steps[step];
  const progress = ((step + 1) / total) * 100;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  if (!showOnboarding) return null;

  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const persistPrefs = async (extra: Partial<OnboardingPreferences> = {}) => {
    await finish({
      theme,
      defaultSnoozeMinutes: snooze,
      notificationsRequested: notifGranted,
      ...extra,
    });
  };

  const handleSkip = async () => {
    await persistPrefs();
  };

  const requestNotifications = async () => {
    try {
      if ("Notification" in window) {
        const res = await Notification.requestPermission();
        setNotifGranted(res === "granted");
      } else {
        setNotifGranted(true);
      }
    } catch {
      setNotifGranted(false);
    } finally {
      next();
    }
  };

  const createFirstReminder = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const [hh, mm] = firstTime.split(":").map(Number);
      const start = new Date();
      start.setHours(hh, mm, 0, 0);
      if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
      const dateStr = start.toISOString().slice(0, 10);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: firstReminder.trim() || "My first reminder",
        start_time: start.toISOString(),
        status: "pending",
        timezone: tz,
        original_date: dateStr,
        task_date: dateStr,
        local_date: dateStr,
        reminder_active: true,
      });
      if (error) throw error;
      toast({ title: "Reminder created 🎉", description: "We'll ping you right on time." });
      next();
    } catch (e: any) {
      toast({
        title: "Couldn't save reminder",
        description: e.message ?? "You can create one later from the home screen.",
        variant: "destructive",
      });
      next();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 pt-4 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <div className="flex-1 max-w-md">
          <Progress value={progress} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground mt-1.5 font-medium tracking-wide">
            Step {step + 1} of {total}
          </p>
        </div>
        <button
          onClick={handleSkip}
          className="ml-4 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Skip <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex items-start sm:items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md mx-auto"
          >
            {current === "welcome" && (
              <StepShell
                icon={<Sparkles className="w-7 h-7" />}
                title="Welcome to Remonk"
                subtitle="Calm, notification-first reminders that just work — across every device, in real time."
              >
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { i: <Bell className="w-5 h-5" />, t: "Lightweight" },
                    { i: <RefreshCw className="w-5 h-5" />, t: "Realtime sync" },
                    { i: <Sparkles className="w-5 h-5" />, t: "Intelligent" },
                  ].map((f) => (
                    <div
                      key={f.t}
                      className="rounded-2xl border bg-card/60 p-3 text-center text-xs font-medium text-muted-foreground flex flex-col items-center gap-1.5"
                    >
                      <span className="text-primary">{f.i}</span>
                      {f.t}
                    </div>
                  ))}
                </div>
              </StepShell>
            )}

            {current === "account" && (
              <StepShell
                icon={<ShieldCheck className="w-7 h-7" />}
                title="You're signed in"
                subtitle="Your reminders are encrypted and synced privately to your account. Sign in on any device to pick up where you left off."
              >
                <div className="rounded-2xl border bg-primary-soft/40 p-4 text-sm text-foreground/80">
                  <p className="font-semibold text-foreground mb-1">Privacy first</p>
                  <p>We only store what you create — no tracking, no ads, no surprises.</p>
                </div>
              </StepShell>
            )}

            {current === "notifications" && (
              <StepShell
                icon={<BellRing className="w-7 h-7" />}
                title="Get reminded the moment it matters"
                subtitle="Notifications are how Remonk works best. Snooze, complete, or open — all without leaving your lock screen."
              >
                <Button
                  size="lg"
                  className="w-full"
                  onClick={requestNotifications}
                >
                  Enable notifications
                </Button>
                <button
                  onClick={next}
                  className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  Maybe later
                </button>
              </StepShell>
            )}

            {current === "demo" && (
              <StepShell
                icon={<Bell className="w-7 h-7" />}
                title="Try a reminder"
                subtitle="This is what a Remonk reminder looks like. Tap a button to interact — just like on your lock screen."
              >
                <FakeNotification
                  title="Drink water 💧"
                  body="Stay hydrated — it's been 2 hours."
                  completed={demoCompleted}
                  onComplete={() => setDemoCompleted(true)}
                />
                {demoCompleted && (
                  <p className="text-center text-xs text-valid font-medium mt-3 animate-fade-in">
                    Nice — that's all there is to it.
                  </p>
                )}
              </StepShell>
            )}

            {current === "snooze" && (
              <StepShell
                icon={<Clock className="w-7 h-7" />}
                title="Snooze, your way"
                subtitle="Quick presets or any custom duration. Pick one to feel it."
              >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: "15 min", v: 15 },
                    { l: "27 min", v: 27 },
                    { l: "1 hour", v: 60 },
                    { l: "Tomorrow", v: 60 * 12 },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setDemoSnoozed(o.v)}
                      className={cn(
                        "rounded-xl border-2 p-3 text-sm font-medium transition-all",
                        demoSnoozed === o.v
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
                {demoSnoozed !== null && (
                  <p className="text-center text-xs text-muted-foreground mt-3 animate-fade-in">
                    Snoozed. We'll remind you again — and sync it everywhere.
                  </p>
                )}

                <div className="mt-5 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Default snooze for new reminders
                  </p>
                  <div className="flex gap-2">
                    {SNOOZE_OPTIONS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setSnooze(m)}
                        className={cn(
                          "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
                          snooze === m
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </StepShell>
            )}

            {current === "theme" && (
              <StepShell
                icon={<Palette className="w-7 h-7" />}
                title="Pick your vibe"
                subtitle="Switch anytime in Settings."
              >
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "group rounded-2xl border-2 p-3 transition-all",
                        theme === t.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn("h-16 rounded-xl border mb-2", t.swatch)} />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{t.label}</span>
                        {theme === t.id && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </StepShell>
            )}

            {current === "sync" && (
              <StepShell
                icon={<RefreshCw className="w-7 h-7" />}
                title="Synced everywhere, instantly"
                subtitle="Complete a reminder on your phone — your tablet knows about it before you blink."
              >
                <div className="space-y-2">
                  <SyncRow label="Phone" delay={0} />
                  <SyncRow label="Tablet" delay={0.4} />
                  <SyncRow label="Web" delay={0.8} />
                </div>
              </StepShell>
            )}

            {current === "first-reminder" && (
              <StepShell
                icon={<CheckCircle2 className="w-7 h-7" />}
                title="Create your first reminder"
                subtitle="A small one. Just to see how it feels."
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      What should we remind you about?
                    </label>
                    <Input
                      value={firstReminder}
                      onChange={(e) => setFirstReminder(e.target.value)}
                      placeholder="e.g. Drink water"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      When?
                    </label>
                    <Input
                      type="time"
                      value={firstTime}
                      onChange={(e) => setFirstTime(e.target.value)}
                    />
                  </div>
                </div>
              </StepShell>
            )}

            {current === "finish" && (
              <StepShell
                icon={<PartyPopper className="w-7 h-7" />}
                title="You're all set"
                subtitle="Remonk is ready. Create reminders by voice, chat, or tap — and let us handle the rest."
              >
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => persistPrefs()}
                >
                  Enter Remonk
                </Button>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      {current !== "finish" && (
        <div
          className="px-6 pb-6 pt-3 flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={back}
            disabled={step === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          {current === "first-reminder" ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={next}>
                Skip
              </Button>
              <Button onClick={createFirstReminder} disabled={submitting} size="lg">
                {submitting ? "Saving…" : "Create reminder"}
              </Button>
            </div>
          ) : (
            <Button onClick={next} size="lg">
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StepShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-soft text-primary mb-5">
        {icon}
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto">
        {subtitle}
      </p>
      {children && <div className="text-left">{children}</div>}
    </div>
  );
}

function FakeNotification({
  title,
  body,
  completed,
  onComplete,
}: {
  title: string;
  body: string;
  completed: boolean;
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="rounded-2xl border bg-card shadow-md overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            R
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-sm font-semibold truncate">Remonk</p>
              <span className="text-[10px] text-muted-foreground">now</span>
            </div>
            <p className="text-sm font-medium truncate">{title}</p>
            <p className="text-xs text-muted-foreground truncate">{body}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t divide-x">
        <button
          onClick={onComplete}
          disabled={completed}
          className={cn(
            "py-2.5 text-xs font-semibold transition-colors",
            completed ? "text-valid" : "text-primary hover:bg-primary-soft/50"
          )}
        >
          {completed ? "✓ Done" : "Done"}
        </button>
        <button
          onClick={onComplete}
          className="py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50"
        >
          Snooze
        </button>
        <button
          onClick={onComplete}
          className="py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50"
        >
          More
        </button>
      </div>
    </motion.div>
  );
}

function SyncRow({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-3 rounded-xl border bg-card p-3"
    >
      <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
        <RefreshCw className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium flex-1">{label}</span>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.25, type: "spring" }}
        className="text-xs text-valid font-semibold flex items-center gap-1"
      >
        <Check className="w-3 h-3" /> synced
      </motion.span>
    </motion.div>
  );
}
