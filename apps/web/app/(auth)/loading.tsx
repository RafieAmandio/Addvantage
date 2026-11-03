export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-tv-paper font-mono text-[11px] uppercase tracking-[0.12em] text-tv-mute">
      <span className="flex items-center gap-2.5">
        <span aria-hidden className="h-3.5 w-3.5 rounded-full border-[1.5px] border-current border-t-transparent motion-safe:animate-spin" />
        Loading
      </span>
    </div>
  );
}
