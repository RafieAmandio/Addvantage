"use client";

import { useEffect } from "react";

export function ConsoleEasterEgg() {
  useEffect(() => {
    const style = "color: #FFD400; font-family: monospace; font-size: 12px;";
    const dim = "color: #666; font-family: monospace; font-size: 11px;";

    console.log(
      "%c╔══════════════════════════════════════╗\n" +
      "║  +VANTAGE // DOMAIN INTELLIGENCE     ║\n" +
      "║  CLASSIFICATION: OPERATOR EYES ONLY  ║\n" +
      "╚══════════════════════════════════════╝",
      style
    );
    console.log(
      "%cYou found the terminal. Good instincts.\nWe build for people who look under the hood.",
      dim
    );
  }, []);

  return null;
}
