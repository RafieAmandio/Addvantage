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
  "mt-2 w-full rounded-lg border border-gray-3 bg-gray-2 px-4 py-3 font-mono text-base text-white shadow-none outline-none transition-all duration-200 placeholder:text-white/25 focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_rgba(255,212,0,0.15)] focus-visible:ring-0";

const labelClass = "block font-mono text-sm font-bold text-white";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-pixel mt-8 flex w-full items-center justify-center gap-2.5 rounded-lg bg-brand py-4 font-mono text-base font-bold text-black transition-all hover:bg-brand-dim active:scale-[0.98] disabled:cursor-wait"
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
      <div className="space-y-6">
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
          <p className="mt-2 font-mono text-xs text-white/35">At least 8 characters.</p>
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
          <div role="alert" className="font-mono text-sm text-blood-bright">
            ● {ERROR_MESSAGES[state.error] ?? "SYSTEM FAULT. Retry."}
          </div>
        )}
        {state.ok && (
          <div role="status" className="font-mono text-sm text-moss">
            ● Password changed. Use it next time you sign in.
          </div>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
