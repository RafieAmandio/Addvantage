export default function SubscriptionLoading() {
  return (
    <div className="bg-grid-fine">
      <div className="animate-pulse border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 space-y-2">
          <div className="h-3 w-36 rounded bg-gray-2" />
          <div className="h-10 w-64 rounded bg-gray-2" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 space-y-12 animate-pulse">
        <div className="border border-brand/40 bg-gray-2/30 p-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 space-y-2">
              <div className="h-3 w-20 rounded bg-gray-2" />
              <div className="h-8 w-40 rounded bg-gray-2" />
            </div>
            <div className="col-span-6 lg:col-span-3 space-y-2">
              <div className="h-3 w-16 rounded bg-gray-2" />
              <div className="h-5 w-28 rounded bg-gray-2" />
            </div>
            <div className="col-span-6 lg:col-span-3 space-y-2">
              <div className="h-3 w-16 rounded bg-gray-2" />
              <div className="h-5 w-20 rounded bg-gray-2" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="col-span-12 border border-gray-3 bg-black p-8 lg:col-span-6 space-y-4">
              <div className="h-3 w-16 rounded bg-gray-2" />
              <div className="h-8 w-28 rounded bg-gray-2" />
              <div className="h-10 w-24 rounded bg-gray-2" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-2 shrink-0 mt-0.5" />
                    <div className="h-3 w-full rounded bg-gray-2" />
                  </div>
                ))}
              </div>
              <div className="h-10 w-full rounded bg-gray-2 mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
