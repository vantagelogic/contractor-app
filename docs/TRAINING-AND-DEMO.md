# VantageLogic — Training & Demo Guide

**Use this document** to update outbound training materials, run live demos, and keep the in-app AI assistant aligned with the product.

**Related docs:** [TRAINING-OWNER.md](./TRAINING-OWNER.md) · [TRAINING-CREW.md](./TRAINING-CREW.md)

---

## Official terminology (always use these in training & demos)

| Say this | Do **not** say | Notes |
|----------|----------------|-------|
| **Project** | Job, contract (unless quoting the client) | Backend field is still `job_id` |
| **Work type** | Cost code, category code | Backend field is `cost_code_id` |
| **Settings** | Setup, Admin panel | All company setup lives under Settings |
| **Dashboard** | Jobs screen | Live profitability view |
| **Site quote** | Field estimate, crew estimate | Crew-built; office reviews |
| **Customer estimate** | Office estimate | Formal PDF to client |
| **Crew Management** | Crew Access, Employees tab | People + logins + overtime |
| **Inventory** (top menu) | Settings → Inventory | Stock is **not** under Settings anymore |

**Rule for trainers:** If a screen label says “Work types” or “Project”, use that exact wording. Never teach “cost code” to end users.

---

## Navigation cheat sheet

### Owner / Admin

**Desktop:** left sidebar · **Mobile:** ☰ menu (top-left)

| Menu item | What it does |
|-----------|--------------|
| **Home** | Morning briefing, today’s action plan, items needing attention, quick voice log |
| **Dashboard** | Live project profitability; expand a card → **Set up project** |
| **Schedule** | Assign shifts; templates on desktop |
| **Inventory** | Stock items, photos, assign to projects |
| **Requests** | Approve/deny crew requests |
| **Estimates** | Customer estimates + review crew site quotes |
| **Billing** | Cost-plus invoices from logged costs |
| **Settings** | Company, notifications, projects, crew, work types, estimating presets, financials, exports |

### Crew

**Mobile:** ☰ menu (top-left)

| Menu item | What it does |
|-----------|--------------|
| **Home** | Week stats, schedule, voice log |
| **Site Quote** | Build site quotes for office |
| **Log Hours & Costs** | Hours, Materials, Mileage |
| **Requests** | Submit and track requests |
| **Settings** | Name, email, password |

---

## Where to add a work type (demo script)

**This is the #1 terminology fix.** Work types are **not** called “cost codes” and there is **no** standalone “Cost Codes” tab.

### Option A — Company-wide list (recommended for setup)

1. Open **Settings**
2. In the left sidebar under **Job setup**, tap **Work types**
   - Breadcrumb shows: `Settings → Job setup → Work types`
3. Enter a name (e.g. *Framing*) → **Add work type**

### Option B — While configuring one project

1. **Dashboard** → expand project → **Set up project**
2. Section **2 · Work types** → type name → **+ Add type**

> Crew cannot log hours until at least one work type exists.

---

## 20-minute owner demo script

Use **Settings → Company Profile → Load Demo Data** if you need sample projects without real crew.

| Min | Show | Talk track |
|-----|------|------------|
| 0–2 | **Home** | “Your morning command center — briefing, action plan, and what needs attention today.” |
| 2–5 | **Settings → Job setup → Work types** | “Work types label where time goes — Framing, Electrical, etc. Crew pick one every time they log.” |
| 5–8 | **Dashboard → + New Project** → expand → **Set up project** | “Contract value, budgeted hours, address, work types, assign crew, pull inventory — all from one place.” |
| 8–10 | **Settings → Crew Management** | “Add crew, hourly rates, create login, link to crew record.” |
| 10–12 | **Schedule** | “Drag templates on desktop; mobile uses Add Shift + template cards.” |
| 12–14 | **Inventory** | “Stock with optional photo; assign to a project or crew requests a pull.” |
| 14–16 | **Estimates** | “Review site quotes from the field; approve or return; build customer PDF.” |
| 16–18 | **Billing** | “Turn logged labour + materials + mileage into a cost-plus invoice.” |
| 18–20 | **Home → voice** | “Hold mic, slide up to lock for hands-free — great on site with gloves.” |

**Close:** “Crew log from their phone; you see margin update on Dashboard in real time.”

---

## 10-minute crew demo script

| Min | Show | Talk track |
|-----|------|------------|
| 0–2 | Login + **Home** | “Your schedule and week at a glance.” |
| 2–5 | **Voice log** | Hold mic → “Log 8 hours on Johnson Basement, framing, today” → slide up to lock if needed → confirm → Save |
| 5–7 | **Log → Hours** | Manual backup if voice mishears project or work type |
| 7–9 | **Log → Materials → Scan Receipt** | Select project + work type first, then photograph receipt |
| 9–10 | **Site Quote** (if used) | Scope + voice/photos → Generate with AI → Submit to office |

---

## Home screen features (owner) — train these explicitly

### Today’s action plan
- Personal checklist stored per day (browser)
- **Add from briefing** pulls flagged items: over-budget projects, pending site quotes, open requests, crew not logged

### Needs action
- **Pending site quotes** listed by **project name** and submitter — tap to open Estimates
- **Crew not logged this week** — **Send reminder notification** pings them in-app

### Morning briefing
- Weather, schedule summary, company flags
- Resilient if API partial data (won’t blank the whole Home screen)

---

## Voice logging — teach this exactly

1. **Hold** the microphone button
2. Speak naturally (*“Log 6 hours on Smith Reno, electrical, today”*)
3. **Hands-free:** slide finger **up** into “Slide up to lock” zone, then release — mic stays on until you tap again
4. Review the summary card → correct project/work type if needed → Submit

Works on **Owner Home** and **Crew Home**. Site Quote AI panel uses the same hold-to-lock pattern.

---

## Settings map (owner training handout)

| Sidebar group | Tab | Purpose |
|---------------|-----|---------|
| **Organization** | Company Profile | Business info, demo data |
| | Notifications | Bell + pop-up alerts |
| | Projects | Create/archive projects |
| | Crew Management | Workers, rates, logins, overtime |
| **Job setup** | **Work types** | Framing, Electrical, etc. |
| | Estimating | Job-type presets for AI quotes |
| **Money & data** | Financials | Overtime multipliers, premium pay |
| | Data Exports | CSV downloads |

**Inventory** → top menu, not Settings.

---

## Common trainee mistakes (and correct answers)

| Wrong belief | Correct answer |
|--------------|----------------|
| “Add cost codes in Settings” | **Settings → Job setup → Work types** |
| “Inventory is in Settings” | **Inventory** in the main ☰ menu |
| “Setup tab for crew” | **Settings → Crew Management** |
| “Bottom nav on owner mobile” | **☰ hamburger** — full menu list |
| “Tap mic once for voice” | **Hold** mic; **slide up** to lock for hands-free |
| “Crew can fix submitted hours” | No — office manages from Dashboard; crew submits a request |

---

## Pre-demo checklist (presenter)

- [ ] Latest frontend deployed (hamburger nav, Home, voice lock)
- [ ] Latest API deployed (`help_knowledge`, `remind-log-hours`, inventory images, briefing migrations)
- [ ] `GEMINI_API_KEY` set (voice + AI quotes + help chat)
- [ ] Demo account with: 1+ project, 2+ work types, 1+ crew login
- [ ] Optional: Load Demo Data for empty accounts
- [ ] Test on **phone width**: ☰ menu, voice hold-to-lock, Settings → Work types path

---

## Smoke test after deploy (5 minutes)

1. **Work types:** Settings → Job setup → Work types → add “Demo Framing” → appears in crew Hours dropdown
2. **Project setup:** Dashboard → expand project → Set up project → add work type inline
3. **Voice:** Hold mic → speak → slide to lock → tap to finish → prefill appears
4. **Reminders:** Owner Home → crew not logged → Send reminder notification → crew sees bell notification
5. **Site quote:** Crew submits → Owner Home shows **named** pending quote → opens Estimates
6. **Inventory:** Add item with photo → Assign to project → stock deducts
7. **AI help:** Ask *“How do I add a work type?”* → must say **Settings → Job setup → Work types**, never “cost code”

---

## AI in-app assistant

- Floating help button (bottom-right desktop; above safe area on mobile)
- Knowledge source: `vantage_logic_api/help_knowledge.py` — **keep in sync with this document**
- Quick prompt for owners includes: *“How do I add a work type?”*

When you change navigation or terminology in the product, update **this file**, **help_knowledge.py**, and the training PDFs together.

---

## Support escalation

1. This guide + role-specific training docs
2. In-app AI help
3. Verify Settings paths (work types, crew, projects)
4. Contact VantageLogic support *(add your channel)*
