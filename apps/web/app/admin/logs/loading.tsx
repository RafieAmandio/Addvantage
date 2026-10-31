export default function LogsLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 rounded-2xl bg-panel" />
      <div className="space-y-3 rounded-2xl bg-panel p-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-5 w-full rounded bg-raised" />
        ))}
      </div>
    </div>
  );
}
