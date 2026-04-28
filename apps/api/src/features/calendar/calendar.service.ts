import { NotFoundError } from "@/core/errors/index.js";
import { calendarRepository } from "./calendar.repository.js";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const CORRELATION_WINDOW_MS = 2 * 60 * 60 * 1000;

interface ListEventsOpts {
  symbols?: string[];
  kinds?: string[];
  from?: Date;
  to?: Date;
  limit?: number;
}

export const calendarService = {
  async listEvents(opts: ListEventsOpts) {
    const to = opts.to ?? new Date();
    const from = opts.from ?? new Date(to.getTime() - THIRTY_DAYS_MS);
    const limit = opts.limit ?? 200;

    if (opts.symbols && opts.symbols.length === 0) return { events: [], from: from.toISOString(), to: to.toISOString() };
    if (opts.kinds && opts.kinds.length === 0) return { events: [], from: from.toISOString(), to: to.toISOString() };

    const events = await calendarRepository.listEvents({
      symbols: opts.symbols,
      kinds: opts.kinds,
      from,
      to,
      limit,
    });

    return {
      symbols: opts.symbols,
      from: from.toISOString(),
      to: to.toISOString(),
      events,
    };
  },

  async getCorrelatedNews(eventId: string) {
    const event = await calendarRepository.findEventById(eventId);
    if (!event) throw new NotFoundError("Event not found");

    if (event.symbols.length === 0) return [];

    const occurredMs = event.occurredAt.getTime();
    const from = new Date(occurredMs - CORRELATION_WINDOW_MS);
    const to = new Date(occurredMs + CORRELATION_WINDOW_MS);

    return calendarRepository.listCorrelatedNews(event.symbols, from, to, 20);
  },
};
