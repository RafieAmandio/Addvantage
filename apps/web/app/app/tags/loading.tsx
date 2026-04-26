export default function TagsLoading() {
  return (
    <div>
      <div className="animate-pulse border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-56 rounded bg-gray-2" />
          <div className="h-5 w-80 rounded bg-gray-2" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 animate-pulse">
        <div className="mb-6 h-10 w-full rounded bg-gray-2" />
        <div className="mb-6 flex items-center justify-between">
          <div className="h-3 w-28 rounded bg-gray-2" />
          <div className="flex gap-px">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-7 w-20 bg-gray-2" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-px bg-gray-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="col-span-12 bg-black p-6 sm:col-span-6 lg:col-span-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-8 rounded bg-gray-2" />
                <div className="h-3 w-16 rounded bg-gray-2" />
              </div>
              <div className="h-6 w-32 rounded bg-gray-2" />
              <div className="h-3 w-24 rounded bg-gray-2" />
              <div className="h-4 w-full rounded bg-gray-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
