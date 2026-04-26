export default function AdminPlansLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-gray-2" />
            <div className="h-10 w-32 rounded bg-gray-2" />
          </div>
          <div className="h-9 w-24 rounded bg-gray-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-gray-3 bg-gray-2/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 rounded bg-gray-2" />
                <div className="h-5 w-16 rounded bg-gray-2" />
              </div>
              <div className="h-3 w-full rounded bg-gray-2" />
              <div className="h-3 w-3/4 rounded bg-gray-2" />
              <div className="flex gap-2">
                <div className="h-7 w-20 rounded bg-gray-2" />
                <div className="h-7 w-16 rounded bg-gray-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
