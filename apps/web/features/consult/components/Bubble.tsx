import { formatTime } from "@/lib/cn";
import type { ConsultMessage } from "@/features/consult/types";

export function Bubble({ msg }: { msg: ConsultMessage }) {
  const isUser = msg.role === "user";
  const isAi = msg.role === "ai";
  const align = isUser ? "items-end" : "items-start";
  const tagColor = isUser
    ? "text-brand"
    : isAi
    ? "text-moss"
    : "text-white";
  const bg = isUser
    ? "bg-brand/10 border-brand/40"
    : isAi
    ? "bg-gray-2 border-gray-3"
    : "bg-gray-2 border-brand/40";

  return (
    <div className={`flex flex-col ${align}`}>
      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-[9px] uppercase tracking-widest2 ${tagColor}`}
        >
          ● {isUser ? "OPERATOR" : isAi ? "ANTS · AI" : `DESK · ${msg.author ?? "TEAM"}`}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          {formatTime(msg.ts)}Z
        </span>
      </div>
      <div
        className={`mt-1 max-w-[80%] whitespace-pre-line border ${bg} p-4 text-sm leading-relaxed text-white/90`}
      >
        {msg.body}
      </div>
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
