import { FUTURA } from "@/features/marketing/lib/data";

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/figma/logo-mark.png"
      alt="+vantage"
      width={size}
      height={size}
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <div
      className="flex items-baseline gap-1 text-white"
      style={{ fontFamily: FUTURA }}
    >
      <span className="font-bold" style={{ fontSize: size * 0.67 }}>
        +
      </span>
      <span className="font-medium" style={{ fontSize: size }}>
        vantage
      </span>
    </div>
  );
}

export function TriangleDown({ className = "h-[10px] w-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 15.341 10.167" className={className} aria-hidden>
      <path d="M0 0H15.341L7.6705 10.167L0 0Z" fill="currentColor" />
    </svg>
  );
}

export function TriangleUp({ className = "h-[10px] w-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 15.341 10.167" className={className} aria-hidden>
      <path d="M0 10.167H15.341L7.6705 0L0 10.167Z" fill="currentColor" />
    </svg>
  );
}

export function IconCloseSquare({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 3C2.44772 3 2 3.44772 2 4V20C2 20.5523 2.44772 21 3 21H21C21.5523 21 22 20.5523 22 20V4C22 3.44772 21.5523 3 21 3H3ZM8.29289 8.29289C8.68342 7.90237 9.31658 7.90237 9.70711 8.29289L12 10.5858L14.2929 8.29289C14.6834 7.90237 15.3166 7.90237 15.7071 8.29289C16.0976 8.68342 16.0976 9.31658 15.7071 9.70711L13.4142 12L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L12 13.4142L9.70711 15.7071C9.31658 16.0976 8.68342 16.0976 8.29289 15.7071C7.90237 15.3166 7.90237 14.6834 8.29289 14.2929L10.5858 12L8.29289 9.70711C7.90237 9.31658 7.90237 8.68342 8.29289 8.29289Z" />
    </svg>
  );
}

export function IconCheckBox({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5ZM17.2929 9.29289C17.6834 9.68342 17.6834 10.3166 17.2929 10.7071L11 17L6.70711 12.7071C6.31658 12.3166 6.31658 11.6834 6.70711 11.2929C7.09763 10.9024 7.7308 10.9024 8.12132 11.2929L11 14.1716L15.8787 9.29289C16.2692 8.90237 16.9024 8.90237 17.2929 9.29289Z" />
    </svg>
  );
}

export function ArrowUpPixel({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M7 13V5.414L4.707 7.707L3.293 6.293L8 1.586L12.707 6.293L11.293 7.707L9 5.414V13H7Z" />
    </svg>
  );
}

export function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex w-full items-center justify-between px-6 text-center font-mono text-base font-bold md:px-[140px]">
      <span className="text-brand">{num}</span>
      <span className="text-white">{label}</span>
    </div>
  );
}
