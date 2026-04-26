export default function ChartLoading() {
  return (
    <div className="min-h-screen bg-black">
      <div className="animate-pulse">
        {/* Header bar */}
        <div className="border-b border-gray-3 px-6 py-3 flex items-center gap-4">
          <div className="h-5 w-24 rounded bg-gray-2" />
          <div className="h-3 w-16 rounded bg-gray-2" />
          <div className="h-3 w-20 rounded bg-gray-2" />
        </div>
        {/* Chart area */}
        <div className="h-[420px] bg-gray-2/20 mx-6 mt-4 rounded" />
        {/* Controls */}
        <div className="flex gap-2 px-6 mt-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-10 rounded bg-gray-2" />
          ))}
        </div>
        {/* Events feed */}
        <div className="mt-6 px-6 space-y-px">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded bg-gray-2/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
