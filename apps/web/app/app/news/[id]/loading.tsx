export default function NewsDetailLoading() {
  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-3 w-32 rounded bg-gray-2" />
            <div className="flex gap-2">
              <div className="h-4 w-14 rounded bg-gray-2" />
              <div className="h-4 w-16 rounded bg-gray-2" />
              <div className="h-4 w-20 rounded bg-gray-2" />
            </div>
            <div className="h-3 w-24 rounded bg-gray-2" />
            <div className="h-10 w-5/6 rounded bg-gray-2" />
            <div className="h-10 w-2/3 rounded bg-gray-2" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-3 w-48 rounded bg-gray-2" />
          <div className="border-l-4 border-gray-3 bg-gray-2/40 p-4 sm:p-6">
            <div className="space-y-3">
              <div className="h-5 w-full rounded bg-gray-2" />
              <div className="h-5 w-4/5 rounded bg-gray-2" />
              <div className="h-5 w-3/5 rounded bg-gray-2" />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            <div className="col-span-12 space-y-3 md:col-span-7">
              <div className="h-3 w-20 rounded bg-gray-2" />
              <div className="flex gap-2">
                <div className="h-7 w-16 rounded bg-gray-2" />
                <div className="h-7 w-20 rounded bg-gray-2" />
                <div className="h-7 w-14 rounded bg-gray-2" />
              </div>
            </div>
            <div className="col-span-12 md:col-span-5">
              <div className="h-3 w-24 rounded bg-gray-2" />
              <div className="mt-4 space-y-2 border border-gray-3 bg-gray-2/30 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 w-16 rounded bg-gray-2" />
                    <div className="h-3 w-20 rounded bg-gray-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
