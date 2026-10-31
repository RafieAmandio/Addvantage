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
    "group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none";
  const variants = {
    primary:
      "bg-brand text-black hover:opacity-90",
    outline:
      "border border-white/[0.14] text-white hover:bg-raised",
    ghost:
      "text-white/70 hover:bg-raised hover:text-white",
  } as const;
  const sizes = {
    sm: "h-8 px-3.5 text-[13px]",
    md: "h-10 px-5 text-[14px]",
    lg: "h-12 px-7 text-[15px]",
  } as const;
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
