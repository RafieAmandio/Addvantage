export default function SourcesLoading() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl bg-panel p-5">
      <div className="h-4 w-36 rounded bg-raised" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2 py-2">
          <div className="h-3 w-28 rounded bg-raised" />
          <div className="h-4 w-3/4 rounded bg-raised" />
        </div>
      ))}
    </div>
  );
}
