import { cn, formatWibTime } from "@/lib/cn";
import type { ConsultMessage } from "@/features/consult/types";

export function Bubble({ msg }: { msg: ConsultMessage }) {
  const isUser = msg.role === "user";
  const align = isUser ? "items-end" : "items-start";
  const tagColor = isUser ? "text-brand" : "text-white";
  const bg = isUser
    ? "bg-brand/10 border-brand/40"
    : "bg-gray-2 border-brand/40";

  return (
    <div className={cn("flex flex-col", align)}>
      <div className="flex items-center gap-2">
        <span
          className={cn("font-mono text-[9px] uppercase tracking-widest2", tagColor)}
        >
          ● {isUser ? "OPERATOR" : `DESK · ${msg.author ?? "TEAM"}`}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          {formatWibTime(msg.ts)} WIB
        </span>
      </div>
      {msg.image ? (
        <a
          href={msg.image.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-1 block max-w-[80%] border p-1.5 transition-colors hover:border-brand focus-visible:border-brand focus-visible:outline-none",
            bg
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={msg.image.url}
            alt={msg.image.name ?? "attachment"}
            className="max-h-80 w-auto max-w-full object-contain"
          />
          {msg.image.name && (
            <div className="mt-1 truncate px-1 pb-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
              {msg.image.name}
            </div>
          )}
        </a>
      ) : (
        <div
          className={cn("mt-1 max-w-[80%] whitespace-pre-line border p-4 text-sm leading-relaxed text-white/90", bg)}
        >
          {msg.body}
        </div>
      )}
      {msg.tags.length > 0 && (
        <div className="mt-1 flex gap-2">
          {msg.tags.map((t) => (
            <span
              key={t}
              className="font-mono text-[9px] uppercase tracking-widest2 text-brand/60"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
