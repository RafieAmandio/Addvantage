export function TypingIndicator() {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-moss">
          ● ANTS · AI
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
          PROCESSING…
        </span>
      </div>
      <div className="mt-1 inline-flex items-center gap-2 border border-gray-3 bg-gray-2 px-4 py-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-moss [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-moss [animation-delay:200ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-moss [animation-delay:400ms]" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
          DESK · TYPING
        </span>
      </div>
    </div>
  );
}
