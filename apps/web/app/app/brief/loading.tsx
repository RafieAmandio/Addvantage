export default function BriefLoading() {
  return (
    <div className="bg-grid">
      <div className="animate-pulse border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 space-y-2">
          <div className="h-3 w-36 rounded bg-gray-2" />
          <div className="h-12 w-56 rounded bg-gray-2" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 p-6 animate-pulse">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="space-y-px bg-gray-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-black p-5 space-y-3">
                <div className="flex gap-3">
                  <div className="h-3 w-16 rounded bg-gray-2" />
                  <div className="h-3 w-12 rounded bg-gray-2" />
                </div>
                <div className="h-6 w-3/4 rounded bg-gray-2" />
                <div className="h-4 w-full rounded bg-gray-2" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="border border-brand/40 bg-gray-2/30 p-5 space-y-3">
            <div className="h-3 w-28 rounded bg-gray-2" />
            <div className="h-6 w-full rounded bg-gray-2" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-gray-3 bg-black p-2 space-y-1">
                  <div className="h-3 w-12 mx-auto rounded bg-gray-2" />
                  <div className="h-4 w-10 mx-auto rounded bg-gray-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
