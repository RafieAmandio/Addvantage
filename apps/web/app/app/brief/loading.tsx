export default function BriefLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="mb-6 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-36 rounded bg-gray-2" />
        </div>
        <div className="border border-gray-3 bg-gray-2/30 p-6 space-y-4">
          <div className="h-3 w-20 rounded bg-gray-2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-gray-2" />
          ))}
          <div className="h-4 w-2/3 rounded bg-gray-2" />
        </div>
        <div className="mt-6 space-y-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-black px-4 py-3 space-y-1">
              <div className="h-3 w-16 rounded bg-gray-2" />
              <div className="h-4 w-3/4 rounded bg-gray-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
