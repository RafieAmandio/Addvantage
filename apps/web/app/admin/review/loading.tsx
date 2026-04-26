export default function ReviewLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-6 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-48 rounded bg-gray-2" />
        </div>
        <div className="space-y-px bg-gray-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-black px-4 py-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-gray-2 shrink-0" />
                <div className="h-3 w-16 rounded bg-gray-2" />
                <div className="h-3 w-24 rounded bg-gray-2" />
              </div>
              <div className="h-4 w-3/4 rounded bg-gray-2" />
              <div className="h-3 w-full rounded bg-gray-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
