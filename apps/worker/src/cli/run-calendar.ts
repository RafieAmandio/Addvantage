import { syncCalendar } from "../calendar/sync";

async function main() {
  const inserted = await syncCalendar();
  console.log(`Calendar sync done: ${inserted} new events`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Calendar sync failed:", err);
  process.exit(1);
});
