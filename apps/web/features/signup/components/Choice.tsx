import { cn } from "@/lib/cn";

/** Selectable option tile used by the profile wizard steps. */
export function Choice({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-xl px-4 py-3 text-left text-[14px] ring-1 transition-colors focus-visible:outline-none focus-visible:ring-brand",
        selected
          ? "bg-brand/[0.08] text-white ring-brand"
          : "bg-raised text-white/70 ring-white/[0.08] hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

export const questionEyebrow = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";
export const questionTitle = "mt-1 text-[18px] font-semibold leading-6 text-white";
