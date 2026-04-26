export default function SubscriptionLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 animate-pulse space-y-2 text-center">
          <div className="mx-auto h-3 w-24 rounded bg-gray-2" />
          <div className="mx-auto h-10 w-56 rounded bg-gray-2" />
          <div className="mx-auto h-4 w-72 rounded bg-gray-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-gray-3 bg-gray-2/30 p-6 space-y-4">
              <div className="h-3 w-16 rounded bg-gray-2" />
              <div className="h-8 w-28 rounded bg-gray-2" />
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
