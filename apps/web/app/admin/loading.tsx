export default function AdminLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          ● Establishing Transmission
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
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
          Decoding Packets · Please Stand By
        </div>
      </div>
    </div>
  );
}
