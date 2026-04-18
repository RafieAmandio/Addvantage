"use client";

import { logoutAction } from "@/features/auth/actions";

interface LogoutButtonProps {
  className?: string;
}

/**
 * Sidebar/header logout trigger. Wraps a real <form action={…}> so it
 * works without JS and respects the server action redirect contract.
 */
export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ??
          "font-mono text-[10px] uppercase tracking-widest2 text-paper/60 underline decoration-lime/40 hover:text-lime"
        }
      >
        Logout →
      </button>
    </form>
  );
}
