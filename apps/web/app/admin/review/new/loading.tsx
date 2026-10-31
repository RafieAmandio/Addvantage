export default function AdminNewsNewLoading() {
  return (
    <div className="grid animate-pulse gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, p) => (
        <div key={p} className="space-y-4 rounded-2xl bg-panel p-5">
          <div className="h-4 w-32 rounded bg-raised" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-raised" />
              <div className="h-11 w-full rounded-xl bg-raised" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
