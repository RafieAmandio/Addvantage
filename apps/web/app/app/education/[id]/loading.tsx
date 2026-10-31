export default function EducationDetailLoading() {
  return (
    <div className="grid animate-pulse gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="h-[60vh] rounded-2xl bg-panel" />
      <div className="hidden h-40 rounded-2xl bg-panel lg:block" />
    </div>
  );
}
