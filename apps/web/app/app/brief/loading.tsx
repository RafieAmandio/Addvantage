export default function BriefLoading() {
  return (
    <div className="grid animate-pulse gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4 rounded-2xl bg-panel p-5">
        <div className="h-5 w-40 rounded bg-raised" />
        <div className="h-3 w-56 rounded bg-raised" />
        <div className="h-10 w-3/4 rounded bg-raised" />
        <div className="h-4 w-full rounded bg-raised" />
        <div className="h-4 w-5/6 rounded bg-raised" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 w-full rounded bg-raised/60" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-56 rounded-2xl bg-panel" />
        <div className="h-64 rounded-2xl bg-panel" />
      </div>
    </div>
  );
}
