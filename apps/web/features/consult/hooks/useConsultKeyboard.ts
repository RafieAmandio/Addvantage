"use client";

import { useEffect, useState } from "react";

export function useConsultKeyboard() {
  const [modeHint, setModeHint] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "i") return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      const input = document.querySelector<HTMLTextAreaElement>(
        "[data-consult-input]"
      );
      if (input) {
        e.preventDefault();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        requestAnimationFrame(() => input.focus());
        setModeHint("INSERT");
        setTimeout(() => setModeHint(null), 900);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onNormal = () => {
      setModeHint("NORMAL");
      setTimeout(() => setModeHint(null), 900);
    };
    window.addEventListener("ants:consult-normal-mode", onNormal);
    return () =>
      window.removeEventListener("ants:consult-normal-mode", onNormal);
  }, []);

  return modeHint;
}
