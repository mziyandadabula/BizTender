import { clsx } from "clsx";

type Status = "green" | "amber" | "red" | "unknown";

const STYLES: Record<Status, string> = {
  green: "bg-signal-greenBg text-signal-green",
  amber: "bg-signal-amberBg text-signal-amber",
  red: "bg-signal-redBg text-signal-red",
  unknown: "bg-slate/10 text-slate",
};

const LABELS: Record<Status, string> = {
  green: "Good standing",
  amber: "Needs attention",
  red: "Action required",
  unknown: "Not yet checked",
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", STYLES[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? LABELS[status]}
    </span>
  );
}
