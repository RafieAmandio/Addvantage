import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 font-mono uppercase tracking-widest2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none";
  const variants = {
    primary:
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
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
