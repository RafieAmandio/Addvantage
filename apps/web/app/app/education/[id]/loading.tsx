export default function EducationDetailLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="mb-4 h-3 w-28 rounded bg-gray-2" />
        <div className="mb-2 h-8 w-5/6 rounded bg-gray-2" />
        <div className="mb-6 flex gap-3">
          <div className="h-4 w-16 rounded bg-gray-2" />
          <div className="h-4 w-20 rounded bg-gray-2" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-gray-2" />
          ))}
          <div className="h-4 w-3/4 rounded bg-gray-2" />
        </div>
        <div className="mt-10 border border-gray-3 bg-gray-2/30 p-5 space-y-3">
          <div className="h-3 w-28 rounded bg-gray-2" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-gray-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
