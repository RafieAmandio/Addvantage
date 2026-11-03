// Run from apps/web: npx tsx features/marketing/lib/sessions.check.ts
import assert from "node:assert/strict";
import { SESSIONS, countdown, fxWeekend, isOpen, nextFlip } from "./sessions";

const [tokyo, london, ny] = SESSIONS;
const t = (iso: string) => Date.parse(iso);

// London opens 08:00 local: 07:00 UTC in summer, 08:00 UTC in winter.
assert.equal(isOpen(london, t("2026-07-01T06:59:00Z")), false);
assert.equal(isOpen(london, t("2026-07-01T07:00:00Z")), true);
assert.equal(isOpen(london, t("2026-12-01T07:30:00Z")), false);
assert.equal(isOpen(london, t("2026-12-01T08:00:00Z")), true);
// New York 08:00 EST = 13:00 UTC in December, 12:00 UTC in July.
assert.equal(isOpen(ny, t("2026-12-01T12:30:00Z")), false);
assert.equal(isOpen(ny, t("2026-07-01T12:30:00Z")), true);
// Tokyo has no daylight saving: 09:00 JST = 00:00 UTC.
assert.equal(isOpen(tokyo, t("2026-12-01T00:00:00Z")), true);

// Friday evening in London: the next open is Monday 08:00 UTC (GMT).
assert.equal(nextFlip(london, t("2026-11-06T20:15:00Z")), t("2026-11-09T08:00:00Z"));
// While open, the next flip is the close.
assert.equal(nextFlip(ny, t("2026-11-04T15:20:00Z")), t("2026-11-04T22:00:00Z"));

// FX weekend: Friday 17:00 to Sunday 17:00 New York.
assert.equal(fxWeekend(t("2026-11-06T21:59:00Z")), false);
assert.equal(fxWeekend(t("2026-11-06T22:00:00Z")), true);
assert.equal(fxWeekend(t("2026-11-08T22:00:00Z")), false);

assert.equal(countdown(3 * 3_600_000 + 12 * 60_000 + 8_000), "3H 12M 08S");
assert.equal(countdown(26 * 3_600_000), "1D 2H 00M 00S");
console.log("sessions ok");
