"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction, type ChangePasswordState } from "@/features/auth/actions";

const INITIAL_STATE: ChangePasswordState = { ok: false };

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Your session expired. Sign in again.",
  invalid_input: "Check the fields and try again.",
  password_too_short: "New password must be at least 8 characters.",
  passwords_dont_match: "New passwords do not match.",
  wrong_password: "Current password is incorrect.",
  change_failed: "Something went wrong. Please try again.",
};

const inputClass =
  "mt-2 h-11 w-full rounded-full bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] transition-shadow placeholder:text-white/25 focus-visible:ring-brand";

const labelClass = "block text-[13px] font-medium text-white/70";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="mt-6 flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-brand text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? (
        <>
          <span
            aria-hidden
            className="inline-block h-4 w-4 shrink-0 border-2 border-black/25 border-t-black"
            style={{ animation: "btnSpin 0.7s steps(8) infinite" }}
          />
          Updating
        </>
      ) : (
        "Change password"
      )}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, INITIAL_STATE);

  return (
    <form action={formAction} className="w-full max-w-md">
      <div className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className={labelClass}>
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            name="currentPassword"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="newPassword" className={labelClass}>
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            name="newPassword"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <p className="mt-2 text-[12px] text-white/40">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            required
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        {state.error && (
          <div role="alert" className="text-[13px] text-down">
            ● {ERROR_MESSAGES[state.error] ?? "SYSTEM FAULT. Retry."}
          </div>
        )}
        {state.ok && (
          <div role="status" className="text-[13px] text-up">
            ● Password changed. Use it next time you sign in.
          </div>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
