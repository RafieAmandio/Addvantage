import { cn, formatWibTime } from "@/lib/cn";
import type { ConsultMessage } from "@/features/consult/types";

export function Bubble({ msg }: { msg: ConsultMessage }) {
  const isUser = msg.role === "user";
  const bubble = isUser
    ? "bg-raised rounded-2xl rounded-br-md"
    : "border border-white/[0.1] rounded-2xl rounded-bl-md";

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <p className="px-1 text-[12px] text-white/40">
        <span className={cn("font-semibold", isUser ? "text-white/70" : "text-brand")}>
          {isUser ? "You" : `Desk, ${msg.author ?? "team"}`}
        </span>
        <span className="px-1.5 text-white/20">/</span>
        {formatWibTime(msg.ts)} WIB
      </p>
      {msg.image ? (
        <a
          href={msg.image.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-1 block max-w-[85%] p-1.5 transition-colors hover:ring-1 hover:ring-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand sm:max-w-[75%]",
            bubble,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={msg.image.url}
            alt={msg.image.name ?? "attachment"}
            className="max-h-80 w-auto max-w-full rounded-xl object-contain"
          />
          {msg.image.name && <div className="mt-1 truncate px-1 pb-0.5 text-[12px] text-white/40">{msg.image.name}</div>}
        </a>
      ) : (
        <div
          className={cn(
            "mt-1 max-w-[85%] whitespace-pre-line px-4 py-3 text-[15px] leading-[22px] text-white/90 sm:max-w-[75%]",
            bubble,
          )}
        >
          {msg.body}
        </div>
      )}
      {msg.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {msg.tags.map((t) => (
            <span key={t} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
