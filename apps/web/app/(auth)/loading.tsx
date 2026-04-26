export default function AuthLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
        <span className="led" aria-hidden />
        AUTHENTICATING TRANSMISSION
      </div>
    </div>
  );
}
