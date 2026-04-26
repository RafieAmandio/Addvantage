import Link from "next/link";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { formatDate, formatTime, cn } from "@/lib/cn";
import type {
  Primer,
  ConsultSession,
  ChannelPost,
} from "@/lib/mock/types";

export function DiscoveryRow({
  featuredPrimer,
  recentSession,
  paid,
  channelTop,
  className,
}: {
  featuredPrimer: Primer;
  recentSession: ConsultSession;
  paid: boolean;
  channelTop: ChannelPost;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-gray-3 bg-gray-2/20", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <SectionHeader n="03 /" label="Primer of the day" />
            <Link
              href={`/app/education/${featuredPrimer.id}`}
              className="mt-4 block border border-gray-3 bg-black p-6 transition-all hover:-translate-y-px hover:border-brand/40 hover:bg-gray-2"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                {featuredPrimer.id} · {featuredPrimer.readingMin} min
              </div>
              <h3 className="mt-3 font-display text-3xl leading-tight text-white">
                {featuredPrimer.title}
              </h3>
              <div className="mt-1 font-mono text-[10px] italic text-brand/70">
                {featuredPrimer.framework}
              </div>
              <p className="mt-4 text-sm text-white/70">
                {featuredPrimer.summary}
              </p>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                Read primer →
              </div>
            </Link>
          </div>

          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <SectionHeader n="04 /" label="Last consultation" />
            <Link
              href="/app/consult"
              className="mt-4 block border border-gray-3 bg-black p-6 transition-all hover:-translate-y-px hover:border-brand/40 hover:bg-gray-2"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                {recentSession.id} · {recentSession.messages.length} messages
              </div>
              <h3 className="mt-3 font-display text-2xl leading-snug text-white">
                {recentSession.title}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {recentSession.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[9px] uppercase tracking-widest2 text-brand/60"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <p className="mt-4 line-clamp-3 text-sm text-white/60">
                {recentSession.messages[recentSession.messages.length - 1]
                  ?.body}
              </p>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                {paid ? "Open session →" : "Locked · upgrade to read →"}
              </div>
            </Link>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <SectionHeader n="05 /" label="From the channel">
              <Link
                href="/app/channel"
                className="font-mono text-[10px] uppercase tracking-widest2 text-brand hover:underline"
              >
                All →
              </Link>
            </SectionHeader>
            <Link
              href="/app/channel"
              className="mt-4 block border border-gray-3 bg-black p-6 transition-all hover:-translate-y-px hover:border-brand/40 hover:bg-gray-2"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                {channelTop.id} · BY {channelTop.author.toUpperCase()}
              </div>
              <p className="mt-4 font-display text-lg leading-snug text-white">
                {channelTop.body}
              </p>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                {formatDate(channelTop.ts)} · {formatTime(channelTop.ts)}Z
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
