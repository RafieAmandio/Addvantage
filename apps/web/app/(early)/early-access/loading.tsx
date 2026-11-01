export default function EarlyAccessLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
        <span className="led" aria-hidden />
        Establishing secure channel
      </div>
    </div>
  );
}
