export default function PlanDetailLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="mb-2 h-3 w-20 rounded bg-gray-2" />
        <div className="mb-6 h-8 w-1/2 rounded bg-gray-2" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-gray-3 bg-gray-2/30 p-4 space-y-2">
                <div className="h-3 w-24 rounded bg-gray-2" />
                <div className="h-4 w-full rounded bg-gray-2" />
                <div className="h-4 w-3/4 rounded bg-gray-2" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="border border-gray-3 bg-gray-2/30 p-4 space-y-3">
              <div className="h-3 w-20 rounded bg-gray-2" />
              <div className="h-6 w-16 rounded bg-gray-2" />
              <div className="h-4 w-full rounded bg-gray-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
