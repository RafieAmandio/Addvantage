export default function ChannelLoading() {
  return (
    <div>
      <div className="animate-pulse border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 space-y-2">
          <div className="h-3 w-36 rounded bg-gray-2" />
          <div className="h-10 w-48 rounded bg-gray-2" />
          <div className="h-5 w-72 rounded bg-gray-2" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 animate-pulse">
        <div className="h-3 w-20 rounded bg-gray-2" />
        <div className="mt-6 space-y-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-l-2 border-brand/40 pl-6 space-y-3">
              <div className="flex gap-3">
                <div className="h-3 w-16 rounded bg-gray-2" />
                <div className="h-3 w-28 rounded bg-gray-2" />
              </div>
              <div className="h-5 w-full rounded bg-gray-2" />
              <div className="h-5 w-2/3 rounded bg-gray-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
