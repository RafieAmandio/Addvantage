export default function ConsultLoading() {
  return (
    <div className="grid animate-pulse gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="h-[75vh] min-h-[480px] rounded-2xl bg-panel" />
      <div className="hidden space-y-4 lg:block">
        <div className="h-56 rounded-2xl bg-panel" />
        <div className="h-36 rounded-2xl bg-panel" />
      </div>
    </div>
  );
}
