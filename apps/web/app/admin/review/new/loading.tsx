export default function AdminNewsNewLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="mb-8 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-8 w-48 rounded bg-gray-2" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-gray-2" />
              <div className="h-10 w-full rounded bg-gray-2/60" />
            </div>
          ))}
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-gray-2" />
            <div className="h-32 w-full rounded bg-gray-2/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
