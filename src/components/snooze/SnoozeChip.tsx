import { cn } from "@/lib/utils";

interface SnoozeChipProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

export function SnoozeChip({ label, active, onClick }: SnoozeChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
        "border touch-manipulation active:scale-95",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-card text-foreground border-border hover:border-primary/40"
      )}
    >
      {label}
    </button>
  );
}
