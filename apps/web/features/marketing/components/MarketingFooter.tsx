import Link from "next/link";
import { LogoMark, Wordmark } from "@/features/marketing/components/icons";

export function MarketingFooter() {
  return (
    <footer className="mt-[80px] flex flex-wrap items-start justify-between gap-10 bg-white/[0.03] p-6 md:mt-[140px] md:p-[140px]">
      <div className="flex w-full flex-col gap-[42px] md:max-w-[310px]">
        <div className="flex items-center gap-3">
          <LogoMark size={45} />
          <Wordmark size={36} />
        </div>
        <p className="text-base font-light leading-[1.4] text-white">
          +Vantage does not manage funds. ANTS accepts no liability for
          trading decisions made by recipients. Liability waiver enforced at
          signup.
        </p>
      </div>
      <div className="flex w-full max-w-[227px] flex-col gap-[17px] text-base text-white">
        <p className="font-bold">Surface</p>
        <p>Telegram (free pillars)</p>
        <p>DOMAIN web (paid)</p>
        <p>1v1 Consult</p>
      </div>
      <div className="flex w-full max-w-[227px] flex-col gap-[17px] text-base text-white">
        <p className="font-bold">Operator</p>
        <Link href="/login" className="transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none">
          Login
        </Link>
        <Link href="/signup" className="transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none">
          Request Access
        </Link>
      </div>
    </footer>
  );
}
