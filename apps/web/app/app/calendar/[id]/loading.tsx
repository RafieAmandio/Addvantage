export default function CalendarEventLoading() {
  return (
    <div className="min-h-screen bg-black">
      <div className="animate-pulse border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-3">
            <div className="h-3 w-16 rounded bg-gray-2" />
            <div className="h-3 w-2 rounded bg-gray-2" />
            <div className="h-3 w-24 rounded bg-gray-2" />
          </div>
          <div className="mt-3 h-9 w-2/3 rounded bg-gray-2" />
          <div className="mt-4 flex gap-3">
            <div className="h-5 w-16 rounded bg-gray-2" />
            <div className="h-5 w-14 rounded bg-gray-2" />
            <div className="h-5 w-20 rounded bg-gray-2" />
          </div>
          <div className="mt-4 h-4 w-full max-w-xl rounded bg-gray-2" />
          <div className="mt-2 h-4 w-3/4 max-w-xl rounded bg-gray-2" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-4 h-4 w-32 rounded bg-gray-2" />
        <div className="space-y-px">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 w-full rounded bg-gray-2/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
