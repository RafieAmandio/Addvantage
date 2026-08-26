"use client";

import { useState, useTransition } from "react";
import { saveMentionPreference } from "@/features/auth/actions";

export function MentionPreferenceToggle({ initial }: { initial: boolean }) {
  // `allow` = happy to be named. The stored flag is inverted for display: the
  // switch reads "keep my consults private".
  const [allow, setAllow] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function toggle() {
    const next = !allow;
    setAllow(next);
    setError(false);
    startTransition(async () => {
      const res = await saveMentionPreference(next);
      if (!res.ok) {
        setAllow(!next); // revert on failure
        setError(true);
      }
    });
  }

  const isPrivate = !allow;

  return (
    <div className="flex max-w-md items-start justify-between gap-4">
      <div>
        <p className="font-mono text-sm font-bold text-white">Keep my consults private</p>
        <p className="mt-1 font-mono text-xs text-white/50">
          When on, the team is told not to mention you by name if they share your
          question in the group.
        </p>
        {error && (
          <p className="mt-1 font-mono text-xs text-red-400">Couldn&apos;t save, try again.</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isPrivate}
        aria-busy={pending}
        onClick={toggle}
        disabled={pending}
        className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          isPrivate ? "bg-brand" : "bg-gray-3"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
            isPrivate ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
