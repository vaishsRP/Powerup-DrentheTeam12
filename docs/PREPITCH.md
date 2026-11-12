# Pre-pitch: Thu 12 Nov, 14:00 (5 minutes + feedback)

**Goal:** get the challenge owner to confirm we're solving the right problem, and get answers to our questions. It's a "v0.0001": a concept plus a sketch, not a demo.
**Screen-share:** (1) the teammate mockup (`image.png`) while explaining the concept; (2) optionally this repo's README.
**Speaker:** [DECIDE]. English is fine; the TenneT experts speak English.
All facts below have a ✅ source in [RESEARCH.md](RESEARCH.md). The section numbers in brackets point there.

---

## 0:00–0:20 · Opening
> "We're Team 12, Track 2. In one sentence: we're building a **living, shared register of everyone's energy plans**. It shows, per substation area, **when the grid runs out, who must decide what and by when, and which measure helps in the meantime.**"

## 0:20–1:30 · The problem (in Drenthe's own facts)
- **Feed-in is full.** TenneT's congestion study of December 2025 found **no room**, so no new solar or wind parks can connect. Offtake is limited (yellow on the map). (§7)
- **It gets harder.** The province's Energy Vision expects peak load to grow **×3 to ×5 by 2050**. (§7)
- **Building takes years.** Extending a station takes ~4 years; a new station ~7 or more. Key upgrades are late: **Veenoord-Boerdijk was needed in 2027 and is now expected in 2031.** (§9)
- **The knowledge exists, but it's scattered:**
  - housing plans, the RES, heat programmes, industry cluster strategies, connection requests, investment plans
  - different formats
  - municipal borders instead of grid areas
  - unclear certainty
  - updated every two years
- **Evidence:**
  > "In its formal response to Enexis' investment plan, the **Province of Drenthe asked** to know *when and where capacity becomes available*, for **red/orange flags on delayed projects**, and for a **quarterly report on changes and required decisions**. Enexis answered that the investment plan is *a static document updated once every two years*. **That gap is what we're filling.**" (§9)

## 1:30–3:00 · Our concept (show the mockup)
1. **Collect.** Every party submits plans in **one form**. We base it on the official **pMIEK project sheet (RVO projectfiche)** and its phases, plus three fields:
   - **maturity**: how certain is it?
   - **confidentiality**: e.g. industry plans visible only to grid operators
   - **source document**
2. **See.** A map of **station areas around the real TenneT substations**, with a year slider from 2026 to 2035. You see where and when offtake or feed-in runs out, and which plans cause it.
3. **Diagnose.** Click an area to see its plans, its load over the years, and the peak-day curve. Drenthe's problem is the solar peak at midday.
4. **Test a measure:**
   - pair solar with demand: cable pooling, or a group transport agreement (GTO) from 2027
   - battery
   - time-block contract
   - shift timing

   You see whether the area goes from red to green.
5. **Output: the regional measures map.** For each area it gives the best measure, and **the decision deadline**: the latest moment it must be in the pMIEK to make the investment plan, given the lead time. It also gives the change report the province asked for.

## 3:00–3:40 · Why this is different
- The **capaciteitskaart** shows *today*. The **investment plan** is *static and two-yearly*. **ETM and TNO's REV** are *calculation models*.
- **We're the front door:** the shared, living intake plus a decision calendar. We feed those tools (export), we don't replace them.
- **No scoring model.** Drenthe's pMIEK framework explicitly isn't a multi-criteria analysis. We support the discussion with facts, deadlines and options.

## 3:40–5:00 · Our questions for you (pick 4–5)
1. **Is this the problem you meant?** Is the bigger pain the *format* of plans, or their *certainty*?
2. **Who should own and maintain this register:** the province, the Energy Board, or the grid operators?
3. **Would you trust plans that municipalities and companies submit themselves?** How do you label certainty internally?
4. **Which area unit is useful to you:** 110 kV station areas, or down to medium-voltage stations?
5. **Does our deadline logic match reality?** We assume pMIEK in February → investment plan to ACM in January the following year, with lead times of ~1 year (transformer), ~4 years (extension) and ~7+ years (new station).
6. **Is there any data we may use?** For example rough capacity or load per Drenthe station area, or the full project list.
7. Do you use **TNO's REV**? What's missing in it for you?

> Close: "Thanks! We'll build this into a clickable prototype by tomorrow."

---

## After the pre-pitch (do this immediately)
- [ ] One person writes the feedback and answers into [PLAN.md §12](PLAN.md).
- [ ] The team decides on the open items in PLAN.md §11.
