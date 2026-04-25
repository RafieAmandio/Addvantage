export function ClassificationStripe({
  label = "RESTRICTED // OPERATOR EYES ONLY",
}: {
  label?: string;
}) {
  return (
    <div className="relative">
      <div className="classification-stripe h-1.5" />
      <div className="flex items-center justify-between border-b border-gray-3 bg-gray-2 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand">
        <span className="flex items-center gap-2">
          <span className="led lime" />
          {label}
        </span>
        <span className="hidden text-white/40 sm:inline">
          ANTS // DOMAIN // ACTIVE TRANSMISSION
        </span>
      </div>
    </div>
  );
}
