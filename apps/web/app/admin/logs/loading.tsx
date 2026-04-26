export default function LogsLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 space-y-2">
          <div className="h-3 w-28 rounded bg-gray-2" />
          <div className="h-8 w-48 rounded bg-gray-2" />
          <div className="h-5 w-80 rounded bg-gray-2" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-px bg-gray-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-black px-4 py-3 space-y-2">
              <div className="h-3 w-16 rounded bg-gray-2" />
              <div className="h-6 w-12 rounded bg-gray-2" />
            </div>
          ))}
        </div>
        <div className="space-y-px bg-gray-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-black px-4 py-3 grid grid-cols-12 gap-4">
              <div className="col-span-2 h-4 rounded bg-gray-2" />
              <div className="col-span-1 h-4 rounded bg-gray-2" />
              <div className="col-span-2 h-4 rounded bg-gray-2" />
              <div className="col-span-1 h-4 rounded bg-gray-2" />
              <div className="col-span-1 h-4 rounded bg-gray-2" />
              <div className="col-span-1 h-4 rounded bg-gray-2" />
              <div className="col-span-1 h-4 rounded bg-gray-2" />
              <div className="col-span-3 h-4 rounded bg-gray-2" />
            </div>
          ))}
        </div>
    </div>
  );
}
