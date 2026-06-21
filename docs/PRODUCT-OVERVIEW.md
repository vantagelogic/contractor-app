# VantageLogic — Product Overview (Internal)

Master reference for training, website, onboarding, and distributor materials.  
Last updated: June 2025.

---

## Product Summary

| Item | Detail |
|------|--------|
| **Name** | VantageLogic |
| **Category** | Job costing & crew tracking for trades |
| **Users** | Owner, Admin, Crew |
| **Platform** | Web app (React frontend, FastAPI backend) |
| **AI** | Google Gemini 2.5 Flash |
| **Billing** | Stripe subscriptions |
| **Trial** | 14 days, no credit card |

---

## Related Documents

| Document | Audience | Purpose |
|----------|----------|---------|
| [WEBSITE-COPY.md](./WEBSITE-COPY.md) | Marketing | Landing page, pricing, FAQ |
| [TRAINING-OWNER.md](./TRAINING-OWNER.md) | Owners / admins | Setup and daily operations |
| [TRAINING-CREW.md](./TRAINING-CREW.md) | Field crew | Logging, voice, requests |
| This file | Internal / distributors | Complete feature inventory |

---

## Subscription Tiers

| Tier | Crew limit | Price |
|------|------------|-------|
| Starter | 5 | $49/mo |
| Growth | 15 | $99/mo |
| Pro | 30 | $179/mo |

---

## Feature Matrix

### Authentication & accounts
- [x] Signup (company + owner)
- [x] Email verification (Resend)
- [x] Login / JWT
- [x] Forgot / reset password
- [x] Roles: owner, admin, crew
- [x] User ↔ employee linking
- [x] Profile & company settings

### Projects & costing
- [x] Projects (CRUD, active/completed)
- [x] Contract value & budgeted hours
- [x] Work types (cost codes)
- [x] Live dashboard with margin
- [x] Change orders
- [x] Burden rates on employees
- [x] Overtime / premium hour rules

### Field logging (crew)
- [x] Timesheets
- [x] Materials (manual, receipt scan, inventory pull)
- [x] Mileage
- [x] Voice logging (AI)
- [x] Schedule view + pre-fill from shifts

### Scheduling (admin)
- [x] Weekly schedule grid
- [x] Shift templates
- [x] Drag-and-drop (desktop)
- [x] Start/end times, colours, notes

### Requests
- [x] Crew submit requests
- [x] Admin approve / deny
- [x] Comment threads
- [x] Inventory pull → stock deduction

### Inventory
- [x] Stock items with quantities & prices
- [x] Crew pull via request
- [x] Admin direct assign to project

### Estimating
- [x] Job types & work category templates
- [x] Office customer estimates + PDF
- [x] AI estimate suggest (owner)
- [x] Crew site quotes + AI generate
- [x] Submit → review → approve/return workflow
- [x] Estimate comment threads
- [x] Approve estimate → dashboard baseline

### Billing
- [x] Cost-plus invoice from unbilled costs
- [x] Markup, labour, materials, mileage lines
- [x] Invoice PDF
- [x] Magic links: sub invoice upload, lien waiver

### AI features
- [x] Voice parse entry (timesheet/material/mileage/request)
- [x] Receipt parse (photo → line items)
- [x] Field estimate generate (notes/photos → rows)
- [x] Estimate suggest (description → templates)
- [x] Help chat (role-aware, multi-turn)
- [x] Rate limiting on AI endpoints

### Platform
- [x] Notifications (in-app bell)
- [x] Onboarding checklist (owner)
- [x] CSV data export
- [x] Demo data seed
- [x] Stripe checkout & webhooks
- [x] Trial expiry handling

### Not built (do not promise)
- [ ] Native iOS/Android apps
- [ ] Offline mode
- [ ] QuickBooks / Xero sync
- [ ] SMS / push notifications
- [ ] Crew self-edit timesheets
- [ ] Multi-company franchise admin

---

## AI Feature Details

| Endpoint / UI | Model | Input | Output |
|---------------|-------|-------|--------|
| `/voice/parse-entry` | Gemini 2.5 Flash | Transcript + project/work type lists | Structured entry (type, hours, job, etc.) |
| `/receipts/parse` | Gemini 2.5 Flash | Receipt image | Vendor, items, totals (JSON) |
| `/field-estimates/{id}/generate` | Gemini 2.5 Flash | Notes, transcript, photos | Line items, assumptions, questions |
| `/estimates/suggest` | Gemini 2.5 Flash | Job description | Template picks + summary |
| `/help-chat` | Gemini 2.5 Flash | Message + role + history | Support reply |

**Requires:** `GEMINI_API_KEY` on API server.

---

## Recent Polish (Pre-Distributor)

1. Help chat: quick prompts, conversation history, mobile UX, rate limits
2. Voice request navigation bugfix (crew → crew_requests)
3. Voice prefill on crew requests form
4. Onboarding checklist: work types step added
5. Help assistant prompt updated for Quote/Estimate/Billing
6. Production build verified

---

## Deployment Checklist

- [ ] Render backend deployed (contractor-api) with latest `main.py` + `cost_plus.py`
- [ ] `GEMINI_API_KEY` set
- [ ] `STRIPE_SECRET_KEY`, price IDs, webhook secret set
- [ ] `RESEND_API_KEY` for email (optional; auto-verify if absent)
- [ ] Frontend production build deployed
- [ ] Smoke test: owner setup → crew voice log → quote → invoice

---

## Terminology Map (UI ↔ Backend)

| UI label | Backend term |
|----------|--------------|
| Project | Job |
| Work type | Cost code |
| Site quote | Field estimate (status: field_draft) |

---

## Distributor One-Liner

> Crew talk into their phone to log hours, scan receipts, and draft site quotes. You see job profitability live and invoice clients from logged costs — no double entry.
