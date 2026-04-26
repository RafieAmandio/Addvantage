export default function TagsLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 animate-pulse space-y-2">
          <div className="h-3 w-24 rounded bg-gray-2" />
          <div className="h-10 w-28 rounded bg-gray-2" />
        </div>
        <div className="flex flex-wrap gap-2 animate-pulse">
          {[20, 28, 16, 24, 18, 32, 22, 14, 26, 20, 30, 16, 24, 18].map(
            (w, i) => (
              <div
                key={i}
                className="h-7 rounded bg-gray-2"
                style={{ width: `${w * 4}px` }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
