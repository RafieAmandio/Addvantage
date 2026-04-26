import { cn } from "@/lib/cn";
import { scoreStyle } from "@/features/calendar/lib/style";

export function ScoreCell({ value }: { value: number }) {
  return (
    <div
      className={cn(
        "flex h-8 items-center justify-center font-mono text-sm font-semibold",
        scoreStyle(value)
      )}
      title={`Score ${value} / 9`}
    >
      {value}
    </div>
  );
}
