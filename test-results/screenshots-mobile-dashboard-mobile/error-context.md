# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: screenshots.spec.ts >> mobile: dashboard
- Location: .screenshots/screenshots.spec.ts:22:7

# Error details

```
Error: Channel closed
```

```
Error: page.waitForLoadState: Test ended.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: "Demo mode — static fixtures, no live data. Covered: news · plan · watchlist · calendar."
  - generic [ref=e3]:
    - generic:
      - dialog "Navigation":
        - generic:
          - generic:
            - generic:
              - link "ANTS.":
                - /url: /
              - generic: DOMAIN // OPERATOR
            - generic:
              - button "Close navigation":
                - img
          - navigation:
            - generic:
              - generic: Live transmissions
              - generic:
                - link "TX-00 Home":
                  - /url: /app
                  - generic:
                    - generic: TX-00
                    - generic: Home
                - link "TX-00b Today's Brief":
                  - /url: /app/brief
                  - generic:
                    - generic: TX-00b
                    - generic: Today's Brief
                - link "TX-01 News":
                  - /url: /app/news
                  - generic:
                    - generic: TX-01
                    - generic: News
                - link "TX-02 Calendar":
                  - /url: /app/calendar
                  - generic:
                    - generic: TX-02
                    - generic: Calendar
                - link "TX-06 My Channel":
                  - /url: /app/channel
                  - generic:
                    - generic: TX-06
                    - generic: My Channel
            - generic:
              - generic: Operator surfaces
              - generic:
                - link "TX-03 Trading Plan ●":
                  - /url: /app/plan
                  - generic:
                    - generic: TX-03
                    - generic: Trading Plan
                  - generic: ●
                - link "TX-04 Consultation ●":
                  - /url: /app/consult
                  - generic:
                    - generic: TX-04
                    - generic: Consultation
                  - generic: ●
                - link "TX-05 Education":
                  - /url: /app/education
                  - generic:
                    - generic: TX-05
                    - generic: Education
                - link "— Hashtags":
                  - /url: /app/tags
                  - generic:
                    - generic: —
                    - generic: Hashtags
                - link "— Watchlist":
                  - /url: /app/watchlist
                  - generic:
                    - generic: —
                    - generic: Watchlist
            - generic:
              - generic: Account
              - generic:
                - link "— Subscription":
                  - /url: /app/subscription
                  - generic:
                    - generic: —
                    - generic: Subscription
          - generic:
            - generic:
              - generic:
                - generic: ● TIER 00
                - generic: U-00417
              - generic: Operator
              - generic: Free access
              - link "Upgrade access →":
                - /url: /app/subscription
              - generic:
                - generic:
                  - button "Logout →"
    - generic [ref=e4]:
      - banner [ref=e5]:
        - generic [ref=e7]:
          - generic [ref=e8]:
            - button "Open navigation" [ref=e9] [cursor=pointer]:
              - img [ref=e10]
            - generic [ref=e12]: ● LIVE
          - generic [ref=e13]:
            - generic [ref=e14]:
              - button "Free" [ref=e15] [cursor=pointer]
              - button "VIP+" [ref=e16] [cursor=pointer]
            - button "Search the DOMAIN" [ref=e17] [cursor=pointer]:
              - img [ref=e18]
            - button "Notifications (7 unread)" [ref=e22] [cursor=pointer]:
              - img [ref=e23]
              - generic [ref=e26]: "7"
            - button "Show keyboard shortcuts and help" [ref=e27] [cursor=pointer]: "?"
      - main [ref=e30]:
        - generic [ref=e31]:
          - generic [ref=e32]:
            - generic [ref=e36]:
              - generic [ref=e37]:
                - text: Sunday, 26 April 2026
                - heading "Night watch, Operator." [level=1] [ref=e38]:
                  - text: Night watch,
                  - text: Operator.
                - paragraph [ref=e39]: The DOMAIN has been transmitting overnight. 5 high-impact items, 4 open setups on the Trading Plan, and 36 high-impact events on the calendar in the next 48h.
                - button "Search news, plans, primers, channels…" [ref=e40] [cursor=pointer]:
                  - img [ref=e41]
                  - generic [ref=e44]: Search news, plans, primers, channels…
                - generic [ref=e45]:
                  - generic [ref=e46]: "Try:"
                  - button "fed" [ref=e47] [cursor=pointer]
                  - button "BBCA" [ref=e48] [cursor=pointer]
                  - button "loss aversion" [ref=e49] [cursor=pointer]
                  - button "drawdown" [ref=e50] [cursor=pointer]
                  - button "USDIDR" [ref=e51] [cursor=pointer]
              - complementary [ref=e52]:
                - generic [ref=e53]:
                  - generic [ref=e54]:
                    - generic [ref=e55]: Operator
                    - generic [ref=e56]: ● TIER 00
                  - button "Operator✎ rename" [ref=e57] [cursor=pointer]
                  - generic [ref=e58]: U-00417 · Free access
                  - generic [ref=e59]:
                    - generic [ref=e60]:
                      - generic [ref=e61]: "5"
                      - generic [ref=e62]: High news
                    - generic [ref=e63]:
                      - generic [ref=e64]: "4"
                      - generic [ref=e65]: Setups
                    - generic [ref=e66]:
                      - generic [ref=e67]: "36"
                      - generic [ref=e68]: Cal · 48h
                  - link "Open today's full brief →" [ref=e69]:
                    - /url: /app/brief
                  - link "Upgrade access" [ref=e70]:
                    - /url: /app/subscription
            - generic [ref=e72]:
              - text: ● Jump to
              - generic [ref=e73]:
                - link "TX-01 News" [ref=e74]:
                  - /url: /app/news
                  - generic [ref=e75]:
                    - generic [ref=e76]: TX-01
                    - generic [ref=e77]: News
                - link "TX-02 Calendar" [ref=e78]:
                  - /url: /app/calendar
                  - generic [ref=e79]:
                    - generic [ref=e80]: TX-02
                    - generic [ref=e81]: Calendar
                - link "TX-03 Trading Plan LOCKED" [ref=e82]:
                  - /url: /app/plan
                  - generic [ref=e83]:
                    - generic [ref=e84]: TX-03
                    - generic [ref=e85]: Trading Plan
                  - generic [ref=e87]: LOCKED
                - link "TX-04 Consultation LOCKED" [ref=e88]:
                  - /url: /app/consult
                  - generic [ref=e89]:
                    - generic [ref=e90]: TX-04
                    - generic [ref=e91]: Consultation
                  - generic [ref=e93]: LOCKED
                - link "TX-05 Education" [ref=e94]:
                  - /url: /app/education
                  - generic [ref=e95]:
                    - generic [ref=e96]: TX-05
                    - generic [ref=e97]: Education
                - link "TX-06 My Channel" [ref=e98]:
                  - /url: /app/channel
                  - generic [ref=e99]:
                    - generic [ref=e100]: TX-06
                    - generic [ref=e101]: My Channel
            - generic [ref=e104]:
              - generic [ref=e105]:
                - generic [ref=e106]:
                  - generic [ref=e107]:
                    - generic [ref=e108]: 01 /
                    - generic [ref=e110]: Top of the wire
                    - generic [ref=e111]: · 3 most-impact items
                  - link "Full feed →" [ref=e112]:
                    - /url: /app/news
                - generic [ref=e113]:
                  - link "N-2604-016 high impact ▲ bullish BI holds 7DRR at 6.00%, governor signals USDIDR 16,000 is the line in the sand The 16,000 threshold matters more than the rate itself. BI has burned reserves to defend it twice this quarter. If USDIDR breaks 16,000 and BI doesn't intervene by the next session, the implicit cap is gone — and that's the trade, not the rate decision." [ref=e114]:
                    - /url: /app/news/N-2604-016
                    - generic [ref=e115]:
                      - generic [ref=e116]: N-2604-016
                      - generic [ref=e117]: high impact
                      - generic [ref=e119]:
                        - generic [ref=e120]: ▲
                        - text: bullish
                    - heading "BI holds 7DRR at 6.00%, governor signals USDIDR 16,000 is the line in the sand" [level=3] [ref=e121]
                    - paragraph [ref=e122]: The 16,000 threshold matters more than the rate itself. BI has burned reserves to defend it twice this quarter. If USDIDR breaks 16,000 and BI doesn't intervene by the next session, the implicit cap is gone — and that's the trade, not the rate decision.
                  - link "N-2604-015 medium impact ▲ bullish JKSE foreign net buy +Rp 1.2T on the day, concentrated in big-four banks Foreign flow is the cleanest signal in IDX right now because local liquidity is thin. Concentration in BBCA / BBRI specifically (not spread across the board) tells you this is positioning for the BI decision, not generic bullishness. Watch for reversal on the close." [ref=e123]:
                    - /url: /app/news/N-2604-015
                    - generic [ref=e124]:
                      - generic [ref=e125]: N-2604-015
                      - generic [ref=e126]: medium impact
                      - generic [ref=e127]:
                        - generic [ref=e128]: ▲
                        - text: bullish
                    - heading "JKSE foreign net buy +Rp 1.2T on the day, concentrated in big-four banks" [level=3] [ref=e129]
                    - paragraph [ref=e130]: Foreign flow is the cleanest signal in IDX right now because local liquidity is thin. Concentration in BBCA / BBRI specifically (not spread across the board) tells you this is positioning for the BI decision, not generic bullishness. Watch for reversal on the close.
                  - link "N-2604-014 high impact ▼ bearish Fed minutes signal divided committee on June cut as services inflation re-accelerates Hawkish dissent on the dot plot is the tell. Front-end yields lift first; equities rotate from duration-sensitive growth into defensives. Expect compressed vol-of-vol around 14:30 ET." [ref=e131]:
                    - /url: /app/news/N-2604-014
                    - generic [ref=e132]:
                      - generic [ref=e133]: N-2604-014
                      - generic [ref=e134]: high impact
                      - generic [ref=e136]:
                        - generic [ref=e137]: ▼
                        - text: bearish
                    - heading "Fed minutes signal divided committee on June cut as services inflation re-accelerates" [level=3] [ref=e138]
                    - paragraph [ref=e139]: Hawkish dissent on the dot plot is the tell. Front-end yields lift first; equities rotate from duration-sensitive growth into defensives. Expect compressed vol-of-vol around 14:30 ET.
              - complementary [ref=e140]:
                - generic [ref=e141]:
                  - generic [ref=e142]:
                    - generic [ref=e143]: Trading Plan · TX-03
                    - generic [ref=e144]: ● LOCKED
                  - heading "Macro is repricing the cut path. Four setups live." [level=3] [ref=e145]
                  - generic [ref=e146]:
                    - generic [ref=e147]:
                      - generic [ref=e148]: ES1!
                      - generic [ref=e149]: SHORT
                    - generic [ref=e150]:
                      - generic [ref=e151]: USDJPY
                      - generic [ref=e152]: SHORT
                    - generic [ref=e153]:
                      - generic [ref=e154]: HSI
                      - generic [ref=e155]: LONG
                    - generic [ref=e156]:
                      - generic [ref=e157]: BBCA
                      - generic [ref=e158]: LONG
                  - link "Unlock plan →" [ref=e159]:
                    - /url: /app/plan
                - generic [ref=e160]:
                  - generic [ref=e161]:
                    - generic [ref=e162]:
                      - generic [ref=e163]: 02 /
                      - generic [ref=e165]: Calendar · 48h
                    - link "Full →" [ref=e166]:
                      - /url: /app/calendar
                  - generic [ref=e167]:
                    - link "12:30Z US · medium · USD 6/9 Retail Sales MoM FEB" [ref=e168]:
                      - /url: /app/calendar
                      - generic [ref=e169]: 12:30Z
                      - generic [ref=e170]:
                        - generic [ref=e171]:
                          - generic [ref=e172]: US
                          - generic [ref=e173]: ·
                          - generic [ref=e174]: medium
                          - generic [ref=e175]: ·
                          - generic [ref=e176]: USD 6/9
                        - generic [ref=e177]: Retail Sales MoM FEB
                    - link "14:00Z US · high · USD 7/9 ISM Manufacturing PMI MAR" [ref=e178]:
                      - /url: /app/calendar
                      - generic [ref=e179]: 14:00Z
                      - generic [ref=e180]:
                        - generic [ref=e181]:
                          - generic [ref=e182]: US
                          - generic [ref=e183]: ·
                          - generic [ref=e184]: high
                          - generic [ref=e185]: ·
                          - generic [ref=e186]: USD 7/9
                        - generic [ref=e187]: ISM Manufacturing PMI MAR
                    - link "12:30Z US · high · USD 9/9 Non Farm Payrolls MAR" [ref=e188]:
                      - /url: /app/calendar
                      - generic [ref=e189]: 12:30Z
                      - generic [ref=e190]:
                        - generic [ref=e191]:
                          - generic [ref=e192]: US
                          - generic [ref=e193]: ·
                          - generic [ref=e194]: high
                          - generic [ref=e195]: ·
                          - generic [ref=e196]: USD 9/9
                        - generic [ref=e197]: Non Farm Payrolls MAR
            - generic [ref=e200]:
              - generic [ref=e201]:
                - generic [ref=e203]:
                  - generic [ref=e204]: 03 /
                  - generic [ref=e206]: Primer of the day
                - link "P-001 · 4 min Loss Aversion Kahneman & Tversky, 1979 — Prospect Theory The pain of losing a dollar is roughly twice the pleasure of gaining one. Most trading mistakes are downstream of this single asymmetry. Read primer →" [ref=e207]:
                  - /url: /app/education/P-001
                  - generic [ref=e208]: P-001 · 4 min
                  - heading "Loss Aversion" [level=3] [ref=e209]
                  - generic [ref=e210]: Kahneman & Tversky, 1979 — Prospect Theory
                  - paragraph [ref=e211]: The pain of losing a dollar is roughly twice the pleasure of gaining one. Most trading mistakes are downstream of this single asymmetry.
                  - generic [ref=e212]: Read primer →
              - generic [ref=e213]:
                - generic [ref=e215]:
                  - generic [ref=e216]: 04 /
                  - generic [ref=e218]: Last consultation
                - 'link "CS-014 · 6 messages Sizing for the FOMC short #risk-management #loss-aversion Good. One thing to add — write down the exit price right now, before the trade is on. 5,266 stop, targets at 5,184 / 5,142 / 5,098. When price tags any of those, you don''t think, you act. The whole point of pre-committing is to remove the moment of decision, because that''s exactly when loss aversion will hijack you. Locked · upgrade to read →" [ref=e219]':
                  - /url: /app/consult
                  - generic [ref=e220]: CS-014 · 6 messages
                  - heading "Sizing for the FOMC short" [level=3] [ref=e221]
                  - generic [ref=e222]:
                    - generic [ref=e223]: "#risk-management"
                    - generic [ref=e224]: "#loss-aversion"
                  - paragraph [ref=e225]: Good. One thing to add — write down the exit price right now, before the trade is on. 5,266 stop, targets at 5,184 / 5,142 / 5,098. When price tags any of those, you don't think, you act. The whole point of pre-committing is to remove the moment of decision, because that's exactly when loss aversion will hijack you.
                  - generic [ref=e226]: Locked · upgrade to read →
              - generic [ref=e227]:
                - generic [ref=e228]:
                  - generic [ref=e229]:
                    - generic [ref=e230]: 05 /
                    - generic [ref=e232]: From the channel
                  - link "All →" [ref=e233]:
                    - /url: /app/channel
                - link "CH-088 · BY ANTHONY FOMC minutes drop in 40 minutes. The trade is the dissent count, not the inflation language. If 3+ members dissented in either direction, the dot plot is going to move at the next meeting and the curve will tell you which way before the close. 07 Apr 2026 · 13:50Z" [ref=e234]:
                  - /url: /app/channel
                  - generic [ref=e235]: CH-088 · BY ANTHONY
                  - paragraph [ref=e236]: FOMC minutes drop in 40 minutes. The trade is the dissent count, not the inflation language. If 3+ members dissented in either direction, the dot plot is going to move at the next meeting and the curve will tell you which way before the close.
                  - generic [ref=e237]: 07 Apr 2026 · 13:50Z
          - generic [ref=e238]: ANTS // DOMAIN // OPERATOR HOME
  - region "Notifications"
  - alert [ref=e239]
```

# Test source

```ts
  1  | import { test } from "@playwright/test";
  2  | 
  3  | const PAGES = [
  4  |   { name: "dashboard", path: "/app" },
  5  |   { name: "news", path: "/app/news" },
  6  |   { name: "chart", path: "/app/chart/AAPL" },
  7  |   { name: "admin", path: "/admin" },
  8  |   { name: "admin-review", path: "/admin/review" },
  9  |   { name: "login", path: "/login" },
  10 | ];
  11 | 
  12 | for (const { name, path } of PAGES) {
  13 |   test(`desktop: ${name}`, async ({ page }) => {
  14 |     await page.goto(path);
  15 |     await page.waitForLoadState("networkidle");
  16 |     await page.screenshot({
  17 |       path: `.screenshots/${name}-desktop.png`,
  18 |       fullPage: true,
  19 |     });
  20 |   });
  21 | 
  22 |   test(`mobile: ${name}`, async ({ page }) => {
  23 |     await page.goto(path);
> 24 |     await page.waitForLoadState("networkidle");
     |                ^ Error: page.waitForLoadState: Test ended.
  25 |     await page.screenshot({
  26 |       path: `.screenshots/${name}-mobile.png`,
  27 |       fullPage: true,
  28 |     });
  29 |   });
  30 | }
  31 | 
```