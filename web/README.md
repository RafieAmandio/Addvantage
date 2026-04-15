# ANTS // DOMAIN — Mock Frontend

A frontend-only clickable prototype of **ANTS — Alpha Network Trading System** (product surface: **DOMAIN**). All data is mocked. No backend, no real auth, no real payments, no real AI, no Telegram integration.

This exists so you can click through every screen end-to-end and decide what to keep, cut, or change before any real engineering happens.

---

## Run

```bash
cd web
npm install
npm run dev
# open http://localhost:3000
```

Build (used for smoke-testing):

```bash
npm run build
```

---

## What's in here

| Route | Purpose |
|---|---|
| `/` | Landing — positioning, FAQ, pricing teaser, signup CTA |
| `/signup` | 3-step enrollment flow (identifier → self-classification → confirmation) |
| `/signup/liability` | Forced liability waiver — required to enter the DOMAIN |
| `/login` | Operator login (mock — any credentials work) |
| `/app` | DOMAIN dashboard — today's brief (news, plan teaser, calendar peek, channel) |
| `/app/news` | Live news feed with impact + bias filters (free pillar) |
| `/app/calendar` | Economic calendar grouped by day (free pillar) |
| `/app/channel` | Founder broadcast channel (free pillar) |
| `/app/plan` | **Trading Plan** — gated by VIP+ tier, paywall overlay for free users |
| `/app/consult` | **1v1 Consultation** — gated chat with mock AI + team replies, hashtag tagging |
| `/app/education` | Education library — primer cards, some locked |
| `/app/education/[id]` | Primer detail (e.g. Loss Aversion, Recency Bias, Drawdown protocol) |
| `/app/tags` | Hashtag explorer index |
| `/app/tags/[tag]` | Cross-cut view — pulls primers, news, consult logs, channel posts under one tag |
| `/app/subscription` | Tier control + payment ledger + plan upgrade flow |

---

## Tier toggle

Top-right of the dashboard: a **Free / VIP+** toggle. This is a development convenience — flip it to see paywall states across the Trading Plan, Consultation, and locked Education primers without going through the upgrade flow. State persists in `localStorage`.

The same toggle is exposed via the Subscription page if you want to test the "real" upgrade interaction.

---

## Aesthetic

**Declassified intelligence terminal.** Tactical, dense, slightly antagonistic — built around the product's "no beginners, no community, operator-eyes-only" positioning.

- **Type:** Fraunces (display) + IBM Plex Sans (body) + IBM Plex Mono (data, codes, labels)
- **Palette:** warm near-black ink, cream paper, amber as DOMAIN flag color, blood-red for locked/classified, moss-green for live
- **Form language:** classification stripes, numbered sections (`01 /`, `02 /`), small-caps mono labels, terminal LEDs, optional grain overlay, sharp corners (no rounded everything)

---

## What's mocked

Everything. Specifically:

- **Auth:** no real validation. Any email + password gets you through. Liability waiver state is persisted in `localStorage`.
- **Payments:** no real gateway. The "upgrade" button just flips a `tier` flag in `localStorage`.
- **AI consultation:** the "AI" replies with a single canned response after 900ms. Real integration would route to Claude / OpenAI.
- **News, calendar, plans, primers, channel posts, consult sessions:** all hand-authored TypeScript objects in `lib/mock/`.
- **Telegram:** not present. The product spec assumes Telegram is the free-pillar distribution surface, but no bot is built. Free pillars are shown in the web app for demo completeness.

---

## Layout

```
web/
├── app/
│   ├── (auth)/                    # auth route group
│   │   ├── login/
│   │   ├── signup/
│   │   │   └── liability/
│   │   └── layout.tsx
│   ├── app/                       # dashboard route group
│   │   ├── news/
│   │   ├── calendar/
│   │   ├── channel/
│   │   ├── plan/
│   │   ├── consult/
│   │   ├── education/[id]/
│   │   ├── tags/[tag]/
│   │   ├── subscription/
│   │   ├── layout.tsx             # sidebar + topbar shell
│   │   └── page.tsx               # /app — brief
│   ├── globals.css
│   ├── layout.tsx                 # root
│   └── page.tsx                   # / — landing
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Classification.tsx
│       ├── Marker.tsx             # SectionNumber, DataLabel, ImpactPill, BiasBadge
│       ├── Paywall.tsx
│       └── Ticker.tsx
├── lib/
│   ├── cn.ts                      # className + format helpers
│   ├── state.tsx                  # AppStateProvider — tier, liability
│   └── mock/
│       ├── types.ts
│       ├── news.ts
│       ├── calendar.ts
│       ├── channel.ts
│       ├── plans.ts
│       ├── primers.ts
│       ├── consultations.ts
│       ├── hashtags.ts
│       └── user.ts
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## What this prototype is NOT

- It is not a backend. There is no database, no API, no payment gateway, no auth provider.
- It is not a Telegram bot. The product spec calls for a Telegram-first funnel; that's deliberately out of scope here (and probably out of scope for v1 entirely — see PRODUCT.md).
- It is not production-secure. Don't deploy this and expect it to be safe.
- It is not the final product. It exists to align everyone on what's being built before the real work starts.
