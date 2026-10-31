"use client";

import { logoutAction } from "@/features/auth/actions";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className, children }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ??
          "rounded-full px-2.5 py-1 text-[13px] font-medium text-white/55 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        }
      >
        {children ?? "Log out"}
      </button>
    </form>
  );
}
