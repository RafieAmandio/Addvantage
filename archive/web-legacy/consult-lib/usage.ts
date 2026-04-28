if (typeof window !== "undefined") {
  throw new Error("features/consult/queries/usage.ts is server-only");
}

export const FREE_DAILY_TOKEN_CAP = 10_000;

export async function getDailyTokensUsed(_userId: string): Promise<number> {
  return 0;
}
