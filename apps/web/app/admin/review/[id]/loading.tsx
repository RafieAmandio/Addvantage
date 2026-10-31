export default function ReviewDetailLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 rounded bg-panel" />
        <div className="h-10 w-72 rounded-full bg-panel" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4 rounded-2xl bg-panel p-5">
          <div className="h-4 w-24 rounded bg-raised" />
          <div className="h-12 w-full rounded-xl bg-raised" />
          <div className="h-32 w-full rounded-xl bg-raised" />
          <div className="h-24 w-full rounded-xl bg-raised" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-11 rounded-xl bg-raised" />
            <div className="h-11 rounded-xl bg-raised" />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl bg-panel p-5">
          <div className="h-4 w-20 rounded bg-raised" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-3 w-full rounded bg-raised" />
          ))}
        </div>
      </div>
    </div>
  );
}
