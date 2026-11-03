export default function ChannelLoading() {
  return (
    <div className="grid animate-pulse gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5 rounded-2xl bg-panel p-5">
        <div className="h-5 w-32 rounded bg-raised" />
        <div className="h-3 w-48 rounded bg-raised" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-40 rounded bg-raised" />
            <div className="h-4 w-full rounded bg-raised/60" />
            <div className="h-4 w-2/3 rounded bg-raised/60" />
          </div>
        ))}
      </div>
      <div className="h-56 rounded-2xl bg-panel" />
    </div>
  );
}
