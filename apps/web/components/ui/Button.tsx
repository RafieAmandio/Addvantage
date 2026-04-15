import { cn } from "@/lib/cn";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "amber" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "amber",
  size = "md",
  ...props
}: Props) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 font-mono uppercase tracking-widest2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40";
  const variants = {
    amber:
      "bg-amber text-ink hover:bg-amber-dim hover:text-paper border border-amber",
    outline:
      "border border-amber/60 text-amber hover:bg-amber hover:text-ink",
    ghost:
      "text-paper/70 hover:text-amber border border-transparent hover:border-amber/40",
  } as const;
  const sizes = {
    sm: "h-8 px-3 text-[10px]",
    md: "h-10 px-5 text-[11px]",
    lg: "h-14 px-8 text-[12px]",
  } as const;
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
