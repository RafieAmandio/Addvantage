export default function AppLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-grid-fine">
      <div className="flex flex-col items-center gap-6">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          ● ESTABLISHING TRANSMISSION
        </div>

        <div className="flex items-end gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <span
              key={i}
              className="block w-1 bg-brand"
              style={{
                height: "24px",
                animation: `loadbar 1s ease-in-out ${i * 100}ms infinite`,
              }}
            />
          ))}
        </div>

        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          DECODING PACKETS · PLEASE STAND BY
        </div>
      </div>

      <style>{`
        @keyframes loadbar {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
