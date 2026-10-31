export default function PlanLoading() {
  return (
    <div className="grid animate-pulse gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-3 rounded-2xl bg-panel p-5">
        <div className="h-4 w-40 rounded bg-raised" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-raised" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-panel" />
    </div>
  );
}
