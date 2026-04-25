import { SectionNumber } from "@/components/ui/Marker";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-20">
      <div className="col-span-12 lg:col-span-5">
        <SectionNumber n="00 /" label="OPERATOR LOGIN" />
        <h1 className="mt-8 font-display text-6xl leading-[0.9] text-white">
          Identify
          <br />
          <span className="italic text-brand">yourself.</span>
        </h1>
        <p className="mt-8 max-w-sm font-display text-lg text-white/60">
          The DOMAIN does not store browsing history. Sessions are local.
          Logout clears the trace.
        </p>
        <div className="mt-12 border-l border-brand/30 pl-6 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          <div>STATUS: TRANSMISSION LIVE</div>
          <div>NODE: 04 / 11 OPERATIONAL</div>
        </div>
      </div>

      <LoginForm />
    </main>
  );
}
