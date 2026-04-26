export default function PlanLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 animate-pulse space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-40 rounded bg-gray-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-gray-3 bg-gray-2/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 w-12 rounded bg-gray-2" />
                <div className="h-5 w-16 rounded bg-gray-2" />
              </div>
              <div className="h-5 w-3/4 rounded bg-gray-2" />
              <div className="h-3 w-full rounded bg-gray-2" />
              <div className="h-3 w-2/3 rounded bg-gray-2" />
              <div className="flex gap-2 pt-1">
                <div className="h-4 w-12 rounded bg-gray-2" />
                <div className="h-4 w-14 rounded bg-gray-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
