export default function ChartLoading() {
  return (
    <div className="grid animate-pulse grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-2xl bg-panel p-5">
        <div className="h-7 w-24 rounded bg-raised" />
        <div className="mt-2 h-3 w-48 rounded bg-raised" />
        <div className="mt-6 h-[520px] rounded-xl bg-raised/60" />
      </div>
      <div className="space-y-3 rounded-2xl bg-panel p-5">
        <div className="h-4 w-28 rounded bg-raised" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2 py-2">
            <div className="h-3 w-20 rounded bg-raised" />
            <div className="h-4 w-3/4 rounded bg-raised" />
          </div>
        ))}
      </div>
    </div>
  );
}
