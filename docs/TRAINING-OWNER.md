# VantageLogic — Owner & Admin Training Guide

This guide is for business owners and office admins setting up and running VantageLogic.

---

## What VantageLogic Does

VantageLogic helps trades companies track where money goes on every project in real time. Crew log hours, materials, and mileage from their phones. You see live profitability, schedule shifts, manage inventory, build estimates, invoice clients, and respond to crew requests — all in one place.

---

## Roles

| Role | Access |
|------|--------|
| **Owner** | Full access including billing, subscriptions, and all settings |
| **Admin** | Same operational access as owner (dashboard, schedule, estimates, requests, settings) |
| **Crew** | Field logging, site quotes, requests, personal settings only |

---

## Navigation (Owner / Admin)

**Desktop:** left sidebar · **Mobile:** ☰ menu (top-left)

| Tab | Purpose |
|-----|---------|
| **Home** | Morning briefing, today's action plan, items needing attention, voice log |
| **Dashboard** | Live project profitability, margins, change orders; expand → **Set up project** |
| **Schedule** | Assign shifts; drag-and-drop templates on desktop |
| **Inventory** | Stock items, photos, assign to projects |
| **Requests** | Approve/deny crew requests; comment threads |
| **Estimates** | Customer estimates; review crew site quotes |
| **Billing** | Cost-plus client invoices from logged costs |
| **Settings** | Company, projects, crew, work types, estimating, financials, exports |

**Also available:** Notification bell (top right), AI Help assistant (floating button).

---

## First 30 Minutes — Setup Checklist

Complete these steps before inviting crew. The in-app checklist on the Dashboard tracks the same items.

### 1. Create your first project
**Settings → Projects**

- Project name (required) — e.g. *Johnson Basement Reno*
- Project code (optional) — e.g. *JB-2024-047*
- City (optional)
- **Contract value** — what the client pays
- **Budgeted hours** — your estimate; even rough numbers help flag overruns

### 2. Set up work types
**Settings → Job setup → Work types**

Work types label where time and money go on a project. Crew pick one on every timesheet.

Examples: Framing, Electrical, Plumbing, Demo, Tile, Finishing

> **Important:** Set these up before crew start logging. Without work types, timesheets cannot be submitted.

**Alternate path:** Dashboard → expand project → **Set up project** → section **2 · Work types**

### 3. Add crew members
**Settings → Crew Management**

For each person:
- First name, last name
- Trade / role
- Hourly rate
- Burden rate (optional) — covers payroll taxes, CPP, EI, benefits
- Worker type: Employee or Subcontractor

### 4. Give crew app access
**Settings → Crew Management → Create login**

For each crew member:
1. Enter their email and a temporary password
2. Select role: Crew (or Admin if appropriate)
3. Link them to their crew record
4. Share the app URL and their login credentials

**Share message template:**
> Log your hours and materials on VantageLogic: [your app URL]  
> Email: [their email]  
> Temporary password: [password] — change it in Settings after first login.

### 5. Optional — Estimating templates
**Settings → Estimating**

- **Job types** — e.g. Bathroom Reno, Kitchen Remodel
- **Work category templates** — reusable packages with default hours and material costs
- Powers AI estimate suggestions for office and site quotes

### 6. Optional — Financial defaults
**Settings → Financials**

| Setting | Default | Used for |
|---------|---------|----------|
| Labour rate | $75/hr | Estimates and cost-plus invoices |
| Mileage rate | $0.70/km | Mileage costing and invoices |
| Invoice markup | 15% | Cost-plus client invoices |
| Tax label / rate | HST / 0% | Estimates and invoice PDFs |

### 7. Optional — Overtime
**Settings → Crew Management → Overtime section**

- Toggle overtime tracking on/off
- Add premium rules (Overtime 1.5×, Double Time 2.0×, etc.)
- When on, crew log premium hours separately from regular hours

### 8. Optional — Inventory
**Inventory** (main menu — not under Settings)

Add stock items (name, category, optional photo, quantity, prices). Assign to projects from Inventory or Dashboard project setup. Crew pull via Log → Materials → From Inventory.

---

## Home (Owner)

### Morning briefing
Weather, schedule snapshot, and company flags (over-budget projects, pending quotes, etc.).

### Today's action plan
Personal checklist for the day. Tap **Add from briefing** to pull suggested tasks from flagged items.

### Needs action
- Pending **site quotes** listed by project name — tap to open Estimates
- Crew who haven't logged hours — **Send reminder notification**
- Links to Dashboard, Requests, Schedule as needed

### Voice log
Same hold-to-lock microphone as crew: hold → speak → slide up to lock for hands-free → tap mic when done.

---

## Dashboard

### What you see
- Filter: All / Active / Completed projects
- Per-project: contract value, total cost, margin ($ and %), hours vs. budget
- Company totals: hours, labour, materials, revenue, margin

### Expand a project
Tap/click a project card to see timesheets, materials, change orders — or tap **Set up project** for contract, work types, crew assignment, and inventory.

### Change orders
From an expanded project card:
1. Describe what changed — e.g. *Client added second bathroom*
2. Enter amount ($)
3. Choose addition or deduction
4. Submit — contract value updates on dashboard

---

## Schedule

### Shift templates
**Schedule → Templates**

Create reusable presets:
- Name — e.g. *8h Framing – Smith House*
- Project, work type, hours, start/end time, colour, notes

**Desktop:** Drag template from sidebar onto a crew member's day cell.  
**Mobile:** Add Shift → tap template card to pre-fill.

### Assigning shifts
- Select crew member, project, work type, date, hours
- Crew see shifts on their Home screen and can tap to pre-fill timesheets

---

## Requests

### Request types crew can submit
- Additional Materials
- Inventory Pull
- Scope Change
- Equipment Issue
- Safety Concern
- Other

### Your workflow
1. Review pending requests
2. **Approve** — for inventory pulls, stock is deducted automatically
3. **Deny** — optional reason shown to crew
4. Use **comment threads** for back-and-forth without phone tag

---

## Estimates

### Customer estimates
**Estimates → select project → New estimate**

1. Add line items manually, or use **AI suggest** (describe the project in a few words)
2. Adjust hours, materials, labour rate, mileage, tax
3. Save draft → **Generate PDF**
4. Send to customer (download/share PDF)
5. **Approve estimate** when customer accepts — updates dashboard baseline

### Crew site quote review
**Estimates → Pending review queue**

When crew submit site quotes from the field:

| Action | Result |
|--------|--------|
| **Approve for customer** | Quote moves to customer estimate workflow; crew notified |
| **Return to field** | Crew gets reason; they revise and resubmit |
| **Comment** | Discussion thread on the estimate |

### Site quote workflow (end-to-end)
```
Crew builds quote on site (Quote tab)
    → Submits for review
        → Office approves or returns
            → Office finalizes PDF → sends to customer
```

---

## Billing (Cost-Plus Invoicing)

Turn logged project costs into client invoices.

1. **Billing → select project**
2. Review **unbilled** labour, materials, and mileage
3. Adjust markup if needed (default from Financials settings)
4. **Generate client invoice & PDF**
5. Share or download PDF for your customer

**Important:** Once invoiced, those entries are marked billed and won't appear on the next invoice. Only new activity is unbilled.

### Magic links for subcontractors
**Billing → Magic links**

Create a shareable link (valid 14 days) for subs:

| Type | Sub submits |
|------|-------------|
| **Invoice upload** | Name, amount, description, invoice/receipt file |
| **Lien waiver** | Typed legal name as signature, optional signed PDF |

No login required for subs — they use the link directly.

---

## Inventory

**Inventory** (main menu)

### Two ways to charge inventory to a project

1. **Crew request (recommended)**  
   Crew: Log → Materials → From Inventory  
   You: Approve under Requests → stock deducted

2. **Direct assign (admin)**  
   Inventory screen → **Assign**, or Dashboard → Set up project → inventory section

---

## Data Exports

**Settings → Data Exports**

Download CSV for any date range or specific project:
- Timesheets
- Materials
- Mileage
- Inventory pulls
- Change orders

Use for bookkeeping, payroll, or backup.

---

## Notifications

Bell icon (top right) shows:
- New crew requests
- New comments on requests or estimates
- Site quotes submitted / approved / returned
- Change orders
- Budget warnings (project running over hours)

Tap a notification to jump to the relevant screen.

---

## AI Help Assistant

Floating button (bottom right on desktop; above nav on mobile).

- Ask anything about VantageLogic
- Answers adapt to your owner/admin role
- Quick-start prompts available on first open
- Remembers conversation context within the session

Example questions:
- *How do I add a work type?*
- *How do cost-plus invoices work?*
- *How do I review crew site quotes?*
- *How do I give crew app access?*

---

## Subscription & Trial

- **14-day free trial** at signup — no credit card
- Trial ending banner appears when ≤7 days remain
- After trial: data preserved; subscribe to restore full access
- Plans: Starter (5 crew), Growth (15), Pro (30)
- Upgrade when adding crew beyond your tier limit

---

## Demo Data

**Settings → Company Profile → Load Demo Data**

Populates sample projects, crew, and timesheets for exploration during trial. Useful for demos before real crew log.

---

## Key Terminology

| Term | Meaning |
|------|---------|
| **Project** | A job/contract (backend: job) |
| **Work type** | Category of work — Framing, Electrical, etc. (backend: cost code) |
| **Contract value** | Total the client agreed to pay |
| **Budgeted hours** | Your estimated hours for the project |
| **Margin** | Contract value minus total cost |
| **Burden rate** | Extra $/hr on top of hourly rate (taxes, benefits) |
| **Site quote** | Crew-built field estimate for office review |
| **Cost-plus invoice** | Client invoice from actual logged costs + markup |
| **Change order** | Addition or deduction to contract value |

---

## Troubleshooting (Owner)

| Issue | Solution |
|-------|----------|
| Dashboard shows $0 | Crew haven't logged yet, or no active projects |
| Crew can't see a project | Confirm project status is Active |
| Crew missing work types | Add in Settings → Job setup → Work types |
| Quote tab shows "Backend update required" | Redeploy latest API on Render |
| AI features not working | Confirm GEMINI_API_KEY is set on server |
| Crew account "not linked" | Settings → Crew → Edit → link to crew record |
| Export fails | Check date range; retry with smaller range |

---

## Pre-Launch Checklist (Before First Real Users)

- [ ] At least one project created with contract value and budgeted hours
- [ ] Work types added
- [ ] Crew members added with hourly rates
- [ ] App logins created and credentials shared
- [ ] Financial defaults set (labour rate, markup, tax)
- [ ] Backend deployed with latest code
- [ ] GEMINI_API_KEY configured (AI features)
- [ ] Stripe configured (subscriptions)
- [ ] Smoke test: crew voice log → appears on dashboard → generate test invoice

---

## Support Escalation

For issues outside the AI help assistant:
1. Check this guide and crew training doc
2. Verify project/work type/crew setup
3. Contact VantageLogic support (add your support email/channel)
