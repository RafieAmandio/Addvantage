export default function SubscriptionLoading() {
  return (
    <div className="grid animate-pulse gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-[420px] rounded-2xl bg-panel" />
        <div className="h-[420px] rounded-2xl bg-brand/20" />
      </div>
      <div className="space-y-4">
        <div className="h-48 rounded-2xl bg-panel" />
        <div className="h-32 rounded-2xl bg-panel" />
      </div>
    </div>
  );
}
