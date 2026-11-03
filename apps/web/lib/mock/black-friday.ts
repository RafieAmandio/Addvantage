// Mock mode only: an in-memory Black Friday desk so the wizard and /admin/black-friday are
// clickable in demo. Same rules as apps/api black-friday services, same shared summary.
import {
  BF_DINNER_SEATS,
  bfPrice,
  summariseBlackFriday,
  type BfBucketKey,
  type BlackFridayApplicationInput,
} from "@tradevantage/shared/schema";

interface DemoRow {
  id: string;
  email: string;
  name: string;
  contact: string;
  answers: unknown;
  biggestLossBucket: string | null;
  bingxUid: string | null;
  hasBingxProof: boolean;
  plan: string | null;
  paymentMethod: string | null;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  hasPaymentProof: boolean;
  status: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  dinnerInvitedAt: string | null;
  accountId: string | null;
  createdAt: string;
}

const UID_TAKEN = "This BingX UID is already registered with another application.";
const fail = (status: number, apiMessage: string) => Object.assign(new Error(`API ${status}`), { status, apiMessage });

// [name, loss bucket, plan, status, invited]
const SEED: [string, BfBucketKey, "free" | "full", string, boolean][] = [
  ["Rina Hartono", "lt500", "free", "submitted", false],
  ["Bagus Prasetyo", "lt500", "free", "provisioned", false],
  ["Kevin Tan", "lt500", "full", "provisioned", true],
  ["Sari Wulandari", "500-1k", "full", "provisioned", true],
  ["Dimas Saputra", "500-1k", "full", "submitted", false],
  ["Andre Gunawan", "500-1k", "free", "rejected", false],
  ["Michael Lim", "1k-2k", "full", "provisioned", true],
  ["Putri Ananda", "1k-2k", "full", "approved", true],
  ["Yusuf Hakim", "1k-2k", "free", "submitted", false],
  ["Jonathan Wijaya", "1k-2k", "full", "provisioned", false],
  ["Fajar Nugroho", "2k-5k", "full", "provisioned", true],
  ["Lestari Dewi", "2k-5k", "full", "provisioned", true],
  ["Hendra Kusuma", "2k-5k", "free", "approved", false],
  ["Steven Halim", "5k+", "full", "provisioned", true],
  ["Agus Salim", "5k+", "full", "provisioned", true],
  ["Nadia Putri", "5k+", "full", "provisioned", false],
  ["Rizky Ramadhan", "5k+", "full", "submitted", false],
  ["Tommy Santoso", "5k+", "full", "provisioned", false],
  ["Citra Maharani", "1k-2k", "free", "submitted", false],
];

function seed(): DemoRow[] {
  const day = 24 * 3600 * 1000;
  return SEED.map(([name, bucket, plan, status, invited], i) => {
    const full = plan === "full";
    return {
      id: `bf-demo-${String(i + 1).padStart(2, "0")}`,
      email: `${name.split(" ")[0]!.toLowerCase()}@example.com`,
      name,
      contact: i % 2 ? `+62 812 5550 ${String(1000 + i * 37).slice(-4)}` : `@${name.split(" ")[0]!.toLowerCase()}trades`,
      answers: { experience: ["lt1", "1-3", "3-5", "5+"][i % 4], markets: ["crypto", "forex"], positionSize: "1k-10k" },
      biggestLossBucket: bucket,
      bingxUid: String(48_201_337 + i * 7_919),
      hasBingxProof: true,
      plan,
      paymentMethod: full ? "usdt" : null,
      paymentAmount: full ? 500 : null,
      paymentCurrency: full ? "USDT" : null,
      hasPaymentProof: full,
      status,
      reviewedAt: status === "submitted" ? null : new Date(Date.now() - i * day).toISOString(),
      reviewNote: status === "rejected" ? "BingX screenshot does not show the referral code." : null,
      dinnerInvitedAt: invited ? new Date(Date.now() - i * day).toISOString() : null,
      accountId: status === "submitted" || status === "rejected" ? null : `acct-${i}`,
      createdAt: new Date(Date.now() - (i + 1) * day).toISOString(),
    };
  });
}

// globalThis so route handlers and server actions (separate module graphs in dev) share one desk.
const g = globalThis as unknown as { __bfDemo?: DemoRow[] };
const rows = () => (g.__bfDemo ??= seed());

function assertUidFree(uid: string | undefined, email: string) {
  if (uid && rows().some((r) => r.bingxUid === uid && r.email !== email)) throw fail(409, UID_TAKEN);
}

function find(id: string) {
  const r = rows().find((x) => x.id === id);
  if (!r) throw fail(404, "Application not found");
  return r;
}

export function demoBlackFriday(method: string, p: string, body: unknown): unknown {
  const b = (body ?? {}) as Record<string, unknown>;
  let m: RegExpMatchArray | null;

  if (method === "POST" && p === "/black-friday/draft") {
    const email = String(b.email ?? "");
    assertUidFree(b.bingxUid as string | undefined, email);
    const r = rows().find((x) => x.email === email);
    return { status: r?.status ?? "draft", application: null };
  }
  if (method === "POST" && p === "/black-friday/upload-proof") return { imageUrl: `black-friday/demo-${crypto.randomUUID()}.png` };
  if (method === "POST" && p === "/black-friday") {
    const v = b as unknown as BlackFridayApplicationInput;
    assertUidFree(v.bingxUid, v.email);
    const price = v.plan === "full" && v.paymentMethod ? bfPrice(v.paymentMethod) : null;
    const row: DemoRow = {
      id: `bf-demo-${crypto.randomUUID().slice(0, 8)}`,
      email: v.email,
      name: v.name,
      contact: v.contact,
      answers: v.answers,
      biggestLossBucket: v.biggestLossBucket,
      bingxUid: v.bingxUid,
      hasBingxProof: true,
      plan: v.plan,
      paymentMethod: price ? (v.paymentMethod ?? null) : null,
      paymentAmount: price?.amount ?? null,
      paymentCurrency: price?.currency ?? null,
      hasPaymentProof: !!price,
      status: "submitted",
      reviewedAt: null,
      reviewNote: null,
      dinnerInvitedAt: null,
      accountId: null,
      createdAt: new Date().toISOString(),
    };
    g.__bfDemo = [row, ...rows().filter((x) => x.email !== v.email)];
    return { id: row.id };
  }

  if (method === "GET" && p === "/black-friday/admin/applications") return summariseBlackFriday(rows(), 4);
  // Any image works as a stand-in for a signed proof URL.
  if (method === "GET" && /^\/black-friday\/admin\/[^/]+\/proof-url\/(bingx|payment)$/.test(p)) return { url: "/brand/vip-card.svg" };

  if (method === "POST" && (m = p.match(/^\/black-friday\/admin\/([^/]+)\/(approve|reject|dinner)$/))) {
    const r = find(m[1]!);
    const now = new Date().toISOString();
    if (m[2] === "approve") {
      if (r.status !== "submitted" && r.status !== "rejected") throw fail(409, `This application is already ${r.status}`);
      Object.assign(r, { status: "provisioned", reviewedAt: now, accountId: `acct-${r.id}` });
      return { accountId: r.accountId, email: r.email, existingAccount: false, tier: r.plan === "full" ? "vip" : "crypto", tempPassword: "demo-Temp-9xQ2", emailSent: false };
    }
    if (m[2] === "reject") {
      if (r.status !== "submitted") throw fail(409, `This application is already ${r.status}`);
      Object.assign(r, { status: "rejected", reviewedAt: now, reviewNote: (b.note as string) || null });
      return { id: r.id, status: "rejected" };
    }
    if (!b.invited) {
      r.dinnerInvitedAt = null;
      return { id: r.id, dinnerInvitedAt: null };
    }
    if (r.plan !== "full" || !["approved", "provisioned"].includes(r.status)) throw fail(409, "Only approved Full access members can be invited");
    if (!r.dinnerInvitedAt) {
      if (rows().filter((x) => x.dinnerInvitedAt).length >= BF_DINNER_SEATS) throw fail(409, `All ${BF_DINNER_SEATS} dinner seats are taken`);
      r.dinnerInvitedAt = now;
    }
    return { id: r.id, dinnerInvitedAt: r.dinnerInvitedAt };
  }
  return undefined;
}
