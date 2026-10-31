export default function CalendarEventLoading() {
  return (
    <div className="grid animate-pulse gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl bg-panel p-5 sm:p-8">
          <div className="h-3 w-20 rounded bg-raised" />
          <div className="h-3 w-48 rounded bg-raised" />
          <div className="h-10 w-2/3 rounded bg-raised" />
          <div className="h-4 w-full max-w-xl rounded bg-raised" />
        </div>
        <div className="h-64 rounded-2xl bg-panel" />
      </div>
      <div className="h-48 rounded-2xl bg-panel" />
    </div>
  );
}
