import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SnoozeChip } from "./SnoozeChip";
import { useSnoozeIntelligence } from "@/hooks/useSnoozeIntelligence";
import {
  formatSnoozePreview,
  toMinutes,
  type SnoozeUnit,
} from "@/utils/snoozeEngine";

interface SnoozeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSnooze: (minutes: number, source?: string) => void | Promise<void>;
  timezone?: string;
  title?: string;
}

export function SnoozeSheet({
  open,
  onOpenChange,
  onSnooze,
  timezone,
  title = "Snooze reminder",
}: SnoozeSheetProps) {
  const { presets } = useSnoozeIntelligence(timezone);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<SnoozeUnit>("min");

  const customMinutes = useMemo(() => {
    const n = parseInt(customValue, 10);
    if (!n || n <= 0) return null;
    return toMinutes(n, customUnit);
  }, [customValue, customUnit]);

  const effectiveMinutes = customMinutes ?? selectedMinutes;

  const preview = useMemo(() => {
    if (!effectiveMinutes) return "Pick a duration";
    return formatSnoozePreview(effectiveMinutes, timezone);
  }, [effectiveMinutes, timezone]);

  const handleConfirm = async () => {
    if (!effectiveMinutes) return;
    // Soft haptic
    try {
      if ("vibrate" in navigator) navigator.vibrate(8);
    } catch {}
    const source = customMinutes ? "custom" : "preset";
    await onSnooze(effectiveMinutes, source);
    onOpenChange(false);
    setSelectedMinutes(null);
    setCustomValue("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-foreground">{title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-wrap gap-2 mb-5">
          {presets.map((p) => (
            <SnoozeChip
              key={p.id}
              label={p.label}
              active={!customMinutes && selectedMinutes === p.minutes}
              onClick={() => {
                setCustomValue("");
                setSelectedMinutes(p.minutes);
                try {
                  if ("vibrate" in navigator) navigator.vibrate(5);
                } catch {}
              }}
            />
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-foreground font-medium">Custom</p>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 27"
              value={customValue}
              onChange={(e) => {
                setCustomValue(e.target.value.replace(/[^0-9]/g, ""));
                setSelectedMinutes(null);
              }}
              className="flex-1"
            />
            <Select value={customUnit} onValueChange={(v) => setCustomUnit(v as SnoozeUnit)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="min">minutes</SelectItem>
                <SelectItem value="hour">hours</SelectItem>
                <SelectItem value="day">days</SelectItem>
                <SelectItem value="week">weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 mb-4 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15">
          <p className="text-sm font-medium text-foreground">{preview}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!effectiveMinutes}
          >
            Snooze
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
