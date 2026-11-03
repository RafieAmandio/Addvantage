export default function ReviewLoading() {
  return (
    <div className="grid animate-pulse gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl bg-panel p-5">
        <div className="h-4 w-32 rounded bg-raised" />
        <div className="mt-2 h-3 w-20 rounded bg-raised" />
        <div className="mt-6 divide-y divide-white/[0.07]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2 py-4">
              <div className="h-3 w-28 rounded bg-raised" />
              <div className="h-4 w-3/4 rounded bg-raised" />
              <div className="h-3 w-1/2 rounded bg-raised" />
            </div>
          ))}
        </div>
      </div>
      <div className="hidden h-96 rounded-2xl bg-panel lg:block" />
    </div>
  );
}
