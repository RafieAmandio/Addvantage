export default function ReviewDetailLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-4 h-3 w-24 rounded bg-gray-2" />
        <div className="mb-6 h-8 w-2/3 rounded bg-gray-2" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="border border-gray-3 bg-gray-2/30 p-4 space-y-3">
              <div className="h-3 w-20 rounded bg-gray-2" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-gray-2" />
              ))}
            </div>
            <div className="border border-gray-3 bg-gray-2/30 p-4 space-y-3">
              <div className="h-3 w-24 rounded bg-gray-2" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-gray-2" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="border border-gray-3 bg-gray-2/30 p-4 space-y-3">
              <div className="h-3 w-16 rounded bg-gray-2" />
              <div className="h-10 w-full rounded bg-gray-2" />
              <div className="h-24 w-full rounded bg-gray-2" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 flex-1 rounded bg-gray-2" />
              <div className="h-10 flex-1 rounded bg-gray-2" />
              <div className="h-10 w-20 rounded bg-gray-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
