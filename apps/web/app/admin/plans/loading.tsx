export default function AdminPlansLoading() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse rounded-2xl bg-panel p-5">
        <div className="mb-5 h-5 w-40 rounded bg-raised" />
        <div className="divide-y divide-white/[0.07]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              <div className="h-5 w-16 rounded bg-raised" />
              <div className="h-5 flex-1 rounded bg-raised" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
