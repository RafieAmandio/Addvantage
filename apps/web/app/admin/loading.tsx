export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-6 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-40 rounded bg-gray-2" />
        </div>
        <div className="space-y-px bg-gray-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-black px-4 py-3 grid grid-cols-12 gap-4">
              <div className="col-span-2 h-4 rounded bg-gray-2" />
              <div className="col-span-4 h-4 rounded bg-gray-2" />
              <div className="col-span-2 h-4 rounded bg-gray-2" />
              <div className="col-span-2 h-4 rounded bg-gray-2" />
              <div className="col-span-2 h-4 rounded bg-gray-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
