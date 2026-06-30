# Edusan Montessori — Pickup Coordinator

A real-time pickup coordination app for parents, staff, and managers, backed by Supabase.
All three views stay in sync live — when a parent responds, staff and the manager see it
instantly without refreshing.

This is a no-login app: anyone with the link can use it (good for a small private link
shared only with your families/staff). See the "Security note" at the bottom if you want
to lock it down further later.

---

## Part 1 — Create your Supabase project (free)

1. Go to https://supabase.com and sign up (you can use your Google or GitHub account).
2. Click **New project**. Pick any name (e.g. "edusan-pickup"), set a database password
   (save it somewhere), choose the region closest to you, and click **Create new project**.
   Wait ~2 minutes for it to spin up.
3. In the left sidebar, go to **SQL Editor** → **New query**.
4. Open the `supabase_schema.sql` file in this project, copy all of it, paste it into the
   SQL editor, and click **Run**. This creates your `kids` and `activity_log` tables,
   seeds 5 example kids, sets up permissions, and turns on realtime sync.
   - Edit the kid/parent names in that file before running it, or edit them later directly
     in **Table Editor → kids**.
5. Go to **Project Settings** (gear icon) → **API**. You'll need two values from this page:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string under "Project API keys")

---

## Part 2 — Run it locally first (optional but recommended)

1. Install Node.js if you don't have it: https://nodejs.org (the LTS version).
2. Open a terminal in this `pickup-app` folder and run:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
4. Open `.env` and paste in your Project URL and anon key from Part 1, step 5.
5. Run:
   ```
   npm run dev
   ```
   Open the localhost link it gives you. Try switching between Manager/Staff/Parent roles —
   open it in two browser tabs side by side and confirm changes sync between them.

---

## Part 3 — Deploy to get a live link

The easiest path is **GitHub + Vercel** (both free).

### 3a. Put the code on GitHub
1. Sign up at https://github.com if you don't have an account.
2. Create a new repository (e.g. `pickup-app`), keep it **Private** if you'd like.
3. Upload this whole `pickup-app` folder to the repo. The simplest way: on the repo page,
   click **Add file → Upload files**, then drag in everything in this folder (the `.env`
   file should NOT be uploaded — it's already excluded via `.gitignore` if you use git,
   but double check it isn't included if you upload manually).

### 3b. Deploy on Vercel
1. Sign up at https://vercel.com using your GitHub account (this makes step 2 one-click).
2. Click **Add New → Project**, then select your `pickup-app` GitHub repo.
3. Vercel will auto-detect it's a Vite project. Before clicking Deploy, expand
   **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon public key
4. Click **Deploy**. After ~1 minute you'll get a live URL like
   `https://pickup-app-yourname.vercel.app` — that's your live link.
5. Share this link with parents and staff. Everyone visiting it sees the same live data,
   synced in real time through Supabase.

Anytime you want to update the app, push new changes to the GitHub repo and Vercel
redeploys automatically.

---

## How the data is structured

**`kids` table** — one row per child:
- `name`, `parent_name` — who they are and which parent responds for them
- `status` — `yes` / `no` / null (not yet answered)
- `pickup_time` — free text time the parent entered
- `picked_up` — whether staff has marked them collected

**`activity_log` table** — a running feed of every action, shown in the Manager view.

To add, remove, or rename kids/parents, just edit rows directly in Supabase's
**Table Editor → kids** — no code changes needed, and the app updates live everywhere.

"Reset for new day" (Manager view) clears all statuses and the activity log for everyone.

---

## Security note

Because there's no login, the Supabase policies allow anyone with the anon key (which is
public, embedded in the deployed app) to read and write the `kids` and `activity_log`
tables. That's fine for a link only shared privately with your own families and staff, but
it means anyone with the link could technically edit any child's data, not just their own.

If you outgrow that later, the natural next step is adding Supabase Auth (magic-link email
login) and tightening the RLS policies so parents can only update their own kid's row. Happy
to help set that up when you're ready.
