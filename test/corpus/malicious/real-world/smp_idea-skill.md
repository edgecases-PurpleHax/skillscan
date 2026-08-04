---
name: venture-pitch-builder
description: >-
  Turns a startup idea or topic into a research-backed venture strategy and a live Vite + React
  pitch/diligence deck. Interviews the founder for 2-3 shaping questions, delegates market research
  to the deep-research skill, applies the Bling Capital Diligence Playbook (hair-on-fire + 10x, MECE
  segmentation, bottoms-up gross-profit market sizing, D+ financial model), then scaffolds a
  multi-tab web app with a fully computed model where changing one assumption updates the whole deck.
  Use whenever the user wants to build a pitch deck, investor/fundraising deck, business plan,
  diligence materials, market sizing, TAM analysis, go-to-market strategy, or a "living" strategy app
  for a startup or product idea — even if they don't name the Bling playbook or say "pitch deck".
  Trigger on phrases like "build a pitch for X", "help me raise for X", "size the market for X", "turn this idea into a venture strategy", or "make me a fundraising deck".
---

# Venture Pitch Builder

This skill produces two linked things from a startup idea: **(1)** a clear, research-backed
**strategy** grounded in the Bling Capital Diligence Playbook, and **(2)** a **living Vite + React
pitch/diligence deck** — a multi-tab web app whose numbers are computed from one model, so the
founder can tune an assumption and watch the whole deck update.

The methodology is in `references/bling-playbook.md` — **read it before mapping research into the
model.** A complete, known-good worked example is in `assets/reference-app/` — that is the canonical
structure to copy and re-theme, not rebuild from scratch.

Work conversationally throughout. This is a collaboration about the founder's business, not a
one-shot generator. Float the strategy, let them push back, then build.

---

## Step 0 — Interview the founder (before any research)

The idea as stated is almost always underspecified, and the research is only as good as the framing.
Ask **2-3 short shaping questions** with the `AskUserQuestion` tool before researching. Pick the
questions that matter most for *this* idea; good candidates:

- **Who's the customer / who pays?** (the buyer — B2B org, SMB, consumer, marketplace supply side…)
- **Target market & geography** (e.g. US SMBs, EU mid-market, global developers).
- **Stage & purpose** (pre-seed / seed / Series A; raising vs. company-building; rough raise size).
- **Business model** if unclear (SaaS subscription, marketplace take-rate, transactional, usage…).
- **What's already real** (live product? early revenue? just an idea?) — this shapes the Traction tab.

Keep it light — offer concrete options, let them free-text. Weave the answers into the research query
and the model. If the user already gave rich detail, ask fewer questions (or just confirm scope).

---

## Step 1 — Delegate the research to the `deep-research` skill

Invoke the **`deep-research`** skill (via the Skill tool) with a single, well-framed query built from
the idea + interview answers. Frame it around the facts the Bling exercises need, so the report comes
back diligence-ready. Ask it to find, with sources:

- **Market size & supply count** — how many prospective customers exist (the bottoms-up denominator),
  plus top-down industry spend *for context only*. Prefer counts of customers/venues/companies over
  a single TAM dollar figure.
- **Segmentation reality** — what natural segments exist (by size / vertical / geography / type), and
  roughly how many customers per segment.
- **Pricing & willingness to pay** — what customers pay today for this pain; typical ACV / order value;
  whether budget already exists.
- **Competitors & incumbents** — who solves this today, their model, and their **take rate / pricing**
  (this anchors the "10x better" and "why we win" claims).
- **Broader trends** — tailwinds that expand the market over the next 5-10 years.

If the `deep-research` skill is unavailable for any reason, fall back to running web searches
(`WebSearch` / `web_fetch`) yourself against the same checklist — but prefer delegating.

While research runs, you can draft the strategy skeleton from the interview answers.

---

## Step 2 — Map findings into the Bling model

Read `references/bling-playbook.md`, then turn the research into the four exercises. Do the **math
explicitly** before touching code — these become the constants in the app's `data/` files:

1. **Hair-on-fire + 10x** — buyer (and user, if different); the urgent problem in their voice; the
   step-by-step *today* flow and *tomorrow* flow; a **quantified** 10x.
2. **Segmentation** — one MECE axis, named segments with real reference customers, count per segment,
   price/ACV and gross margin per segment.
3. **Market sizing** — per-customer gross profit; the model-unit expansion path; the **mad-libs**:
   *X customers at $Y = K% of the pool to reach $100M gross profit*; then the $500M story.
4. **D+ financial model** — scenarios, hiring plan by month, phased burn, runway, and the raise
   right-sized to the cash trough.

**Share this strategy with the founder in chat** (concise prose, the key numbers and the mad-libs)
and invite corrections *before* building. Their domain knowledge will sharpen the assumptions.

---

## Step 3 — Build the living deck from the reference app

Copy the reference app into the user's working folder under a project-appropriate name, then
**re-theme and refill it** — don't regenerate the scaffolding. The architecture, build config,
responsive CSS, shared components, and the computed-model pattern all transfer directly; only brand,
data, and copy change.

```bash
cp -r <skill>/assets/reference-app  <workspace>/<company>-pitch
cd <workspace>/<company>-pitch
```

Then edit, in this order:

1. **`src/data/brand.js`** — name, tagline, one-line description, market, contact, date.
2. **`src/data/colors.js`** — re-theme to the company's palette (keep the token names; just change
   the hex values). Match the real brand if a site exists.
3. **`index.html`** — title and the Google Font (the reference uses Montserrat; swap if desired).
4. **`src/data/market.js`** — the live market-sizing model: supply denominator (`CORE_MARKET` /
   `EXPANDED_MARKET`), per-customer economics, the `SEGMENTS` definitions, penetration, and the
   `$100M`/`$500M` path functions. **Keep the exported function names** (`buildPath`,
   `customersForGP`, `customerGrossProfit`, `GROSS_MARGIN`, …) so the tabs keep working; change the
   numbers and segment definitions. The example is a B2B SaaS segmented by company size — re-shape it
   for a marketplace (segment by geography/tier), transactional, or usage model as needed.
5. **`src/data/financials.js`** — scenarios, pricing/ACV by segment, opex, hiring plan, and phased
   burn. Re-derive `buildProjections`, `fundingNeed`, and `revenueMix` for the business model at hand
   — the example uses seats/ACV per segment, but the structure is a guide, not a straitjacket.
6. **`src/data/refs.js`** — every figure cited inline as `[n]`, with the real sources from research,
   plus the methodology note.
7. **`src/App.jsx`** — header name/logo/badges and, if needed, the tab list. Twelve tabs ship by
   default; rename, drop, or add tabs to fit the business (e.g. a "Team" tab).
8. **`src/tabs/*.jsx`** — rewrite the *content* of each tab from the researched, founder-confirmed
   strategy. The tab→exercise map is in the reference table in `bling-playbook.md`. Keep the
   visual components (`H2`, `InfoCard`, `FlowStep`, `SectionNote`, `Tag`, `StatCard`) from
   `components/Shared.jsx`; they're generic.

**Principles that make the deck good** (the same ones the reference app embodies):
- Numbers are **computed, not hard-coded** into tabs — tabs import from `data/` so one assumption
  change ripples everywhere. Resist pasting literal figures into JSX.
- Be **honest**. Mark estimates as estimates, show a "read before using these numbers" note where the
  reference does, and cite real sources. Investors trust clear, evolving plans over polished fiction.
- **Gross profit, not GMV.** Keep penetration assumptions believable (single-digit to low-double-digit %).

---

## Step 4 — Install, build, verify, present

```bash
cd <workspace>/<company>-pitch
npm install
npm run build      # must succeed — fix any errors before presenting
npm run dev        # for the founder to view locally (print the localhost URL)
```

A successful `npm run build` is the verification gate: it catches missing imports, renamed exports,
and JSX errors. Then tell the founder how to run it (`npm run dev`), and present the key files /
the strategy summary. Because the model is live, invite them to tune the assumptions in
`data/financials.js` and `data/market.js` — and offer to make changes with them. Keep iterating
conversationally: this deck is a living document.
