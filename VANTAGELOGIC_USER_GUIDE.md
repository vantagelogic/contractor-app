# VantageLogic — User Guide

**App URL:** https://app.vantagelogic.ca  
**Version:** June 2026

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [For Crew Members](#for-crew-members)
   - Logging In
   - Home Screen
   - Logging Hours
   - Logging Materials
   - Logging Mileage
   - Voice Logging
   - Requests
   - Settings
3. [For Administrators / Owners](#for-administrators--owners)
   - Logging In
   - Dashboard
   - Schedule
   - Inventory
   - Requests
   - Setup (Admin)
4. [Tips & Best Practices](#tips--best-practices)
5. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Signing Up (Owners/Admins Only)

1. Go to **https://app.vantagelogic.ca**
2. Tap **Sign Up**
3. Enter your name, company name, email, and password
4. Check your email for a verification link and click it
5. You'll be taken directly into the app

> **Note:** Crew members do **not** sign up themselves. The admin creates their login from the Setup screen (see [Crew Access](#crew-access)).

### Logging In

1. Go to **https://app.vantagelogic.ca**
2. Enter your email and password
3. Tap **Sign In**

### Forgot Password

1. On the login screen, tap **Forgot password?**
2. Enter your email address
3. Check your email for a reset link

---

## For Crew Members

### The Home Screen

When you log in, you'll land on the **Home** screen. It shows:

- A **greeting** with your name and today's date
- **3 stat cards** at the top:
  - **This Week** — hours you've logged this week
  - **This Month** — hours logged this month
  - **Total** — all-time hours logged
- **Your schedule** — shifts your admin has assigned to you, shown by day. Tap a day to see your assignment details (job, hours, any notes from the admin)
- **Quick action buttons** — shortcuts to log hours, materials, or mileage
- **Voice logging button** — tap the microphone to log by speaking (see [Voice Logging](#voice-logging))

---

### Logging Hours (Timesheet)

1. Tap the **Log** button in the bottom navigation
2. Select **Hours**
3. Fill in:
   - **Employee** — your name (pre-filled if your account is linked)
   - **Job** — select the job you worked on
   - **Cost Code** — select the type of work
   - **Date** — defaults to today; tap to change
   - **Hours Worked** — enter the number of hours
   - **Overtime Hours** — enter if applicable
   - **Field Notes** — any relevant notes (optional)
4. Tap **Submit Timesheet**

> **Tip:** You can tap **Log Another** immediately after submitting to add another entry without re-filling all fields.

---

### Logging Materials

1. Tap **Log** → **Materials**
2. Fill in:
   - **Employee** — who made the purchase
   - **Job** — which job the material is for
   - **Cost Code** — type of purchase
   - **Description** — what was purchased (e.g., "2×4 lumber, 50 pcs")
   - **Supplier** — where you bought it (optional)
   - **Quantity** and **Unit Cost** — the app calculates the total automatically
   - **Purchase Date** — defaults to today
   - **Notes** — any extra details (optional)
3. Tap **Submit Material Log**

---

### Logging Mileage

1. Tap **Log** → **Mileage**
2. Fill in:
   - **Employee** — who drove
   - **Job** — which job the trip was for
   - **Trip Date** — defaults to today
   - **Kilometres Driven** — total km for the trip
   - **Purpose** — brief description of the trip (e.g., "Site visit – pickup materials")
   - **Notes** — optional
3. Tap **Submit Mileage**

---

### Voice Logging

The voice feature lets you log hours, materials, or mileage by speaking naturally — no typing required.

1. On the **Home** screen, tap the **microphone button**
2. Speak clearly, for example:
   - *"Log 8 hours on the Smith House job, framing cost code, today"*
   - *"Log 4 hours overtime on Johnson project for electrical work"*
3. The app listens, transcribes your speech, and pre-fills the log form
4. Review the pre-filled form and tap **Submit**

> **Note:** Voice logging requires microphone permission. Your browser will ask the first time — tap **Allow**.

---

### Requests

Use Requests to ask your admin for something — materials, equipment, time off, or anything else.

1. Tap **Requests** in the bottom navigation
2. Tap **+ New Request**
3. Fill in:
   - **Job** — which job the request relates to
   - **Request Type** — e.g., "Additional Materials", "Equipment", "Time Off", "Other"
   - **Description** — explain what you need
   - For material requests: select an item from **Inventory** and enter **Quantity**
4. Tap **Submit Request**

**Viewing your requests:**
- All your submitted requests appear in a list
- Each shows its **status**: Pending, Approved, or Denied
- Tap any request to open a **comment thread** — you and your admin can message each other about it
- A red dot on the request indicates a new reply from your admin

---

### Settings

Tap **Settings** in the bottom navigation to:
- Update your **first name** and **last name**
- Change your **email address**
- Change your **password**
- **Sign Out**

---

## For Administrators / Owners

### Logging In

Go to **https://app.vantagelogic.ca** and sign in with your owner/admin credentials. You'll land on the **Dashboard**.

> **First time?** A welcome walkthrough will appear automatically — it guides you through the 3 setup steps. You can skip it and come back to the **Getting Started** checklist at the top of your Dashboard anytime.

---

### Dashboard

The Dashboard gives you a live overview of all your jobs.

**Top stat bar** shows totals across all jobs (or filtered by status):
- **Total Hours** logged
- **Labour** cost
- **Materials** cost
- **Contract** value
- **Total Cost**
- **Margin** (contract minus cost) — green if positive, red if negative

**Filter buttons** — tap All / Active / Completed to filter which jobs appear.

**Health indicators** at a glance:
- 🟢 **On Track** — job is within budget
- 🟡 **Watch** — cost is above 85% of contract value
- 🔴 **Over Budget** — cost has exceeded contract value or hours exceeded budget

**Job cards** — each job shows:
- Job name, city, and status
- A **profit bar** showing how much of the contract value has been spent on labour vs. materials
- The **margin percentage** badge (top right)
- An **hours bar** if a budget was set — shows hours used vs. budgeted

**Tapping a job** expands it to show:
- Individual **timesheets** — who worked, when, how many hours
- **Materials** purchased against the job
- **Change Orders** — tap **+ Add** to log a change order (additions or deductions to the contract)

---

### Schedule

The Schedule screen is where you assign shifts to crew members.

**Calendar view (desktop):**
- A weekly grid with employees as rows and days as columns
- **Drag a shift template** from the right sidebar onto any cell to create a shift
- **Drag an existing shift** to a new cell to move it
- Shifts are color-coded — template shifts show the template's color; manual shifts show the job's color

**Mobile view:**
- Shows a vertical list of days with assigned shifts per day
- Tap **+ Add Shift** to open the Add Shift form

**Adding a shift manually:**
1. Tap the **Add** tab (or **+ Add Shift** on mobile)
2. Optionally tap a **template card** at the top to pre-fill the form
3. Select: Employee, Job, Cost Code, Date, Hours
4. Add notes if needed
5. Tap **Add Shift**

**Shift Templates:**
Templates are reusable shift presets — perfect for recurring jobs or standard shifts.

1. Tap the **Templates** tab
2. Tap **+ New Template**
3. Enter: name, job, cost code, hours, color, and optional notes
4. Tap **Save Template**

Templates sync across all devices (mobile and desktop) because they're stored on the server.

**Navigation:**
- Use the **← →** arrows to move between weeks
- Use the **job filter** buttons to show only shifts for a specific job

---

### Inventory

The Inventory screen tracks your company's tools, equipment, and stock items.

**Viewing inventory:**
- All active items are listed with their quantity, unit, and prices
- Toggle **Show Inactive** to see deactivated items

**Adding an item:**
1. Fill in: Item Name, Unit (e.g., "pcs", "box", "L"), Quantity, Purchase Price, Charge-Out Price
2. Add notes if needed
3. Tap **Add Item**

**Editing an item:**
- Tap **Edit** on any item to update its details or quantity

**Crew can request inventory items** through the Requests screen. When approved, the quantity is automatically adjusted.

---

### Requests

The Requests screen shows all requests submitted by your crew.

**Reviewing a request:**
1. Open any request to see full details
2. Tap the **comment icon** to open the thread and reply to the crew member
3. Use the **Approve** or **Deny** buttons to action the request
4. If denying, you can add a reason

**Filtering:**
Use the tab bar to filter by: All / Pending / Approved / Denied

**Notification badge:**
A red number on the Requests nav icon shows how many unread requests are waiting.

---

### Setup (Admin)

The Setup screen is your control panel. It has 4 tabs:

#### Jobs Tab
Manage all your jobs.

**Adding a job:**
1. Tap **+ Add Job**
2. Fill in:
   - **Job Name** (required)
   - **Job Code** — an internal reference code (optional)
   - **City** — for your records (optional)
   - **Contract Value** — total contract amount in dollars
   - **Budgeted Hours** — how many hours the job is budgeted for
3. Tap **Add Job**

**Editing a job:**
- Tap **Edit** on any job to update its details or mark it as Completed/Inactive

> **Tip:** Even a rough contract value helps — the Dashboard uses it to calculate your margin and flag jobs that are running over budget.

#### Employees Tab
Manage your crew and subcontractors.

**Adding an employee:**
1. Fill in:
   - **First Name**, **Last Name**
   - **Role** — their job title (e.g., "Journeyman Electrician")
   - **Hourly Rate** — their pay rate (used in labour cost calculations)
   - **Burden Rate** — additional cost per hour (taxes, benefits, etc.) — optional
   - **Worker Type** — Employee or Subcontractor
2. Tap **Add Employee**

**Editing:**
- Tap **Edit** to update their details
- Tap **Deactivate** to remove someone from active schedules (their historical data is preserved)

#### Cost Codes Tab
Cost codes categorize the type of work being done (e.g., Framing, Electrical Rough-In, Finishing).

**Adding a cost code:**
1. Enter a **Code** (short reference, e.g., "FRAM"), **Description**, and **Category**
2. Tap **Add Cost Code**

> **Tip:** Set up cost codes before your crew starts logging — they'll need to select one every time they submit a timesheet.

#### Crew Access Tab
Create and manage login accounts for your crew.

**Creating a login for a crew member:**
1. Enter their **Email** and a temporary **Password**
2. Confirm the password
3. Select their **Role** (Crew or Admin)
4. Link them to an **Employee** record (so their timesheets are properly attributed)
5. Tap **Create Login**

**Sharing the app with your crew:**
- Send them the link: **https://app.vantagelogic.ca**
- They use the email and password you created
- They can change their own password from Settings once they're in

**Managing existing logins:**
- All current crew logins appear in a list
- Tap **Edit** to link a login to a different employee record
- Tap **Deactivate** to revoke access

---

## Tips & Best Practices

**For crew:**
- Log your hours **same day** — it's faster and more accurate
- Use **Field Notes** to flag anything unusual (e.g., "waiting on materials for 1.5h")
- Check the **Home screen** every morning to see your scheduled shifts

**For admins:**
- Set a **contract value and budgeted hours** on every job — even rough estimates make the Dashboard useful
- Use **shift templates** for jobs where you have the same crew doing the same work repeatedly — saves time scheduling
- **Cost codes** should match how you report to your accountant — this makes job costing reports more useful at tax time
- Check the Dashboard **margin badges** weekly — jobs in the red need attention now, not at the end

---

## Troubleshooting

**"Failed to fetch" or content not loading**
- Check your internet connection
- Try a hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- If using the app on a phone, close and reopen the browser

**I can't submit a timesheet / form won't save**
- Make sure all required fields are filled in (they'll highlight red if missing)
- Check that your account subscription is active — expired accounts are read-only

**I'm not seeing my schedule**
- Your account may not be linked to an employee record yet — contact your admin
- The admin assigns shifts — if nothing is showing, no shifts have been assigned for this week yet

**The voice recorder isn't working**
- Make sure you've granted microphone permission to the browser
- On iPhone/iPad, this is in Settings → Safari → Microphone
- Speak clearly and at a normal pace — the app processes your speech after you stop talking

**I forgot my password**
- On the login screen, tap **Forgot password?** and enter your email
- Check your spam folder if the email doesn't arrive within a few minutes

**My timesheet was submitted but I made a mistake**
- Contact your admin — they can view and manage submitted timesheets from the Dashboard

---

*VantageLogic — Built for trades. Questions? Contact your account administrator.*
