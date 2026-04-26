export default function ChartLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-32 rounded bg-gray-2" />
          <div className="h-10 w-48 rounded bg-gray-2" />
          <div className="h-3 w-56 rounded bg-gray-2" />
        </div>
        <div className="animate-pulse space-y-2 sm:items-end">
          <div className="flex gap-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 w-12 bg-gray-2" />
            ))}
          </div>
          <div className="flex gap-px">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 w-10 bg-gray-2" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="animate-pulse border border-gray-3 bg-gray-2 p-3">
            <div className="mb-3 flex justify-end">
              <div className="h-7 w-24 bg-gray-3" />
            </div>
            <div className="h-[520px] bg-black/40" />
          </div>
        </div>
        <aside className="col-span-12 lg:col-span-4">
          <div className="animate-pulse border border-gray-3 bg-gray-2">
            <div className="border-b border-gray-3 px-4 py-3">
              <div className="h-3 w-32 rounded bg-gray-3" />
            </div>
            <div className="divide-y divide-gray-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-12 rounded bg-gray-3" />
                    <div className="h-3 w-20 rounded bg-gray-3" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-gray-3" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
