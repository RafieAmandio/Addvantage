export default function ConsultLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="animate-pulse border-b border-gray-3 px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-gray-2" />
        <div className="h-4 w-32 rounded bg-gray-2" />
      </div>
      <div className="flex-1 px-4 sm:px-6 py-8 space-y-6 max-w-3xl w-full mx-auto animate-pulse">
        <div className="flex gap-3">
          <div className="h-6 w-6 rounded-full bg-gray-2 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-3/4 rounded bg-gray-2" />
            <div className="h-4 w-1/2 rounded bg-gray-2" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="space-y-2 max-w-sm">
            <div className="h-4 w-48 rounded bg-gray-2" />
          </div>
          <div className="h-6 w-6 rounded-full bg-gray-2 shrink-0" />
        </div>
      </div>
      <div className="animate-pulse border-t border-gray-3 px-4 sm:px-6 py-4">
        <div className="h-10 w-full rounded bg-gray-2" />
      </div>
    </div>
  );
}
