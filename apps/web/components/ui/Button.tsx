import { cn } from "@/lib/cn";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "lime" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "lime",
  size = "md",
  ...props
}: Props) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 font-mono uppercase tracking-widest2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40";
  const variants = {
    lime:
      "bg-brand text-black hover:bg-brand-dim hover:text-white border border-brand",
    outline:
      "border border-brand/60 text-brand hover:bg-brand hover:text-black",
    ghost:
      "text-white/70 hover:text-brand border border-transparent hover:border-brand/40",
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
