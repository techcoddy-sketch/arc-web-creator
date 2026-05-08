import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SnoozeSheet } from "@/components/snooze/SnoozeSheet";
import { useReminderInstances } from "@/hooks/useReminderInstances";

/**
 * Web fallback / deep-link route for snoozing a specific instance.
 * Used when the native Android dialog is unavailable.
 */
export default function SnoozeRoute() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const { snooze, instances } = useReminderInstances();
  const [open, setOpen] = useState(true);

  const instance = instances.find((i) => i.id === instanceId);

  useEffect(() => {
    if (!open) navigate(-1);
  }, [open, navigate]);

  if (!instanceId) {
    navigate("/");
    return null;
  }

  return (
    <SnoozeSheet
      open={open}
      onOpenChange={setOpen}
      timezone={instance?.timezone}
      title={(instance?.metadata as any)?.title ?? "Snooze reminder"}
      onSnooze={async (minutes, source) => {
        await snooze(instanceId, minutes, source ?? "notification");
      }}
    />
  );
}
