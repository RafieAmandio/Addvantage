export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-6 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-36 rounded bg-gray-2" />
        </div>
        <div className="mb-2 grid grid-cols-7 gap-px">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-6 rounded bg-gray-2/60" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="mb-px grid grid-cols-7 gap-px">
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="h-16 rounded bg-gray-2/30" />
            ))}
          </div>
        ))}
        <div className="mt-8 space-y-px">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 w-full rounded bg-gray-2/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
