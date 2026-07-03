"use client";

import { useEffect } from "react";

export function DocumentTitle() {
  useEffect(() => {
    const base = "TradeVantage";
    const prev = document.title;
    document.title = base;
    return () => {
      document.title = prev;
    };
  }, []);

  return null;
}
