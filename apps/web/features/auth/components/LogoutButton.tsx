"use client";

import { logoutAction } from "@/features/auth/actions";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ??
          "font-mono text-[10px] uppercase tracking-widest2 text-white/60 underline decoration-brand/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        }
      >
        Logout →
      </button>
    </form>
  );
}
