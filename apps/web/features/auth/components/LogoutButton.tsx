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
          "font-mono text-[10px] uppercase tracking-widest2 text-white/60 underline decoration-brand/40 hover:text-brand"
        }
      >
        Logout →
      </button>
    </form>
  );
}
