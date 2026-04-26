export default function WatchlistLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 animate-pulse space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-36 rounded bg-gray-2" />
        </div>
        <div className="space-y-px bg-gray-3">
          <div className="bg-black px-4 py-2 grid grid-cols-12 gap-4">
            {[3, 2, 2, 2, 3].map((span, i) => (
              <div key={i} className={`col-span-${span} h-3 rounded bg-gray-2/60`} />
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-black px-4 py-3 grid grid-cols-12 gap-4">
              <div className="col-span-3 h-4 rounded bg-gray-2" />
              <div className="col-span-2 h-4 rounded bg-gray-2" />
              <div className="col-span-2 h-4 rounded bg-gray-2" />
              <div className="col-span-2 h-4 rounded bg-gray-2" />
              <div className="col-span-3 h-4 rounded bg-gray-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
