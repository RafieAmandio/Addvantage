export default function WatchlistLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-36 rounded bg-gray-2" />
        </div>
        <div className="mb-8 grid grid-cols-2 gap-px bg-gray-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-black p-5 space-y-2">
              <div className="h-3 w-16 rounded bg-gray-2" />
              <div className="h-8 w-12 rounded bg-gray-2" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-gray-3 bg-gray-2/20">
              <div className="border-b border-gray-3 bg-gray-2/60 px-5 py-4 flex items-center gap-3">
                <div className="h-6 w-6 rounded bg-gray-2" />
                <div className="h-8 w-20 rounded bg-gray-2" />
              </div>
              <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-gray-2" />
                  <div className="h-16 w-full rounded bg-gray-2/30" />
                  <div className="h-16 w-full rounded bg-gray-2/30" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-gray-2" />
                  <div className="h-16 w-full rounded bg-gray-2/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
