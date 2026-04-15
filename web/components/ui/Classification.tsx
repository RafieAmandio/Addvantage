export function ClassificationStripe({
  label = "RESTRICTED // OPERATOR EYES ONLY",
}: {
  label?: string;
}) {
  return (
    <div className="relative">
      <div className="classification-stripe h-1.5" />
      <div className="flex items-center justify-between border-b border-ink-3 bg-ink-2 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-amber">
        <span className="flex items-center gap-2">
          <span className="led amber" />
          {label}
        </span>
        <span className="hidden text-paper/40 sm:inline">
          ANTS // DOMAIN // ACTIVE TRANSMISSION
        </span>
      </div>
    </div>
  );
}
