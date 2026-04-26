export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-40 rounded bg-gray-2" />
            <div className="h-10 w-56 rounded bg-gray-2" />
            <div className="h-4 w-80 rounded bg-gray-2" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 h-12 animate-pulse rounded bg-gray-2/40" />
        <div className="space-y-px bg-gray-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-black p-4 sm:p-6">
              <div className="grid grid-cols-12 gap-3 sm:gap-6">
                <div className="col-span-12 space-y-2 lg:col-span-2">
                  <div className="h-3 w-16 rounded bg-gray-2" />
                  <div className="h-3 w-12 rounded bg-gray-2" />
                </div>
                <div className="col-span-12 space-y-3 lg:col-span-10">
                  <div className="h-6 w-3/4 rounded bg-gray-2" />
                  <div className="h-3 w-full rounded bg-gray-2" />
                  <div className="h-3 w-2/3 rounded bg-gray-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
