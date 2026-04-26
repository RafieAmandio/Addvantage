export default function TagDetailLoading() {
  return (
    <div className="min-h-screen bg-black">
      <div className="animate-pulse border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="h-3 w-20 rounded bg-gray-2" />
          <div className="mt-6 h-3 w-24 rounded bg-gray-2" />
          <div className="mt-2 h-12 w-48 rounded bg-gray-2" />
          <div className="mt-2 h-3 w-32 rounded bg-gray-2" />
          <div className="mt-3 h-4 w-80 rounded bg-gray-2" />
          <div className="mt-4 h-3 w-48 rounded bg-gray-2" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-3 h-4 w-24 rounded bg-gray-2" />
        <div className="grid grid-cols-1 gap-px bg-gray-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-black p-5 space-y-3">
              <div className="h-3 w-16 rounded bg-gray-2" />
              <div className="h-5 w-3/4 rounded bg-gray-2" />
              <div className="h-3 w-24 rounded bg-gray-2" />
              <div className="h-4 w-full rounded bg-gray-2" />
            </div>
          ))}
        </div>
        <div className="mt-8 mb-3 h-4 w-20 rounded bg-gray-2" />
        <div className="space-y-px bg-gray-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-black p-4 space-y-2">
              <div className="h-3 w-20 rounded bg-gray-2" />
              <div className="h-5 w-2/3 rounded bg-gray-2" />
              <div className="h-3 w-full rounded bg-gray-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
