export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 space-y-2 animate-pulse">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-48 rounded bg-gray-2" />
        </div>
        <div className="space-y-px bg-gray-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-black px-4 py-4">
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 mt-2 rounded-full bg-gray-2 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 rounded bg-gray-2" />
                  <div className="h-4 w-3/4 rounded bg-gray-2" />
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
