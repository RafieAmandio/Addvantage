export function cn(...inputs: Array<string | undefined | null | false>) {
  return inputs.filter(Boolean).join(" ");
}

export function formatTime(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
    ...opts,
  });
}

export function formatWibTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatWibDateTime(iso: string) {
  return `${formatDate(iso)} · ${formatWibTime(iso)} WIB`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)} · ${formatWibTime(iso)} WIB`;
}

export function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}
