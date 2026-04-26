export default function ChannelLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 animate-pulse space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-36 rounded bg-gray-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-gray-3 bg-gray-2/30 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-2 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-32 rounded bg-gray-2" />
                  <div className="h-3 w-20 rounded bg-gray-2" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-gray-2" />
              <div className="h-3 w-2/3 rounded bg-gray-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
