export default function PlanCompareLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-40 rounded bg-gray-2" />
        </div>
        <div className="mb-6 flex items-center gap-4">
          <div className="h-10 w-48 rounded bg-gray-2" />
          <div className="h-6 w-6 rounded bg-gray-2" />
          <div className="h-10 w-48 rounded bg-gray-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="border border-gray-3 bg-gray-2/30 p-6 space-y-4">
              <div className="h-5 w-3/4 rounded bg-gray-2" />
              <div className="h-3 w-full rounded bg-gray-2" />
              <div className="h-3 w-2/3 rounded bg-gray-2" />
              <div className="space-y-2 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 w-full rounded bg-gray-2/60" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
