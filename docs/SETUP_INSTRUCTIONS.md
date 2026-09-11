# QuantumRoute — Setup Instructions

**Read this top to bottom. Do not skip steps, even obvious-looking ones.**

Written for someone who has never used a terminal, Supabase, or Vercel. Every
command is written out in full. "Run" a command = type or paste it into your
terminal and press Enter.

This guide gets the app running **on your own computer**. To put it on the
internet, see DEPLOYMENT.md afterward.

---

## Terminal primer (30 seconds)

- **Windows**: Start -> type `PowerShell` -> open Windows PowerShell.
- **Mac**: Cmd+Space -> type `Terminal` -> open it.
- One command per line. Wait for it to finish (the prompt returns) before the next.
- Paste: right-click (PowerShell) or Cmd+V (Mac Terminal).
- `cd foldername` enters a folder; `cd ..` goes up one.

---

## Step 1 — Install Node.js (version 18 or newer)

1. Go to **https://nodejs.org** and download the **LTS** button (not "Current").
2. Run the installer, accepting all defaults.
3. **Close the terminal and open a new one** (installers only affect new terminals).
4. Confirm:
   ```
   node -v
   ```
   Must print v18, v20, or v22 (e.g. `v20.11.0`). If lower, reinstall LTS.
   ```
   npm -v
   ```
   Any number is fine.

---

## Step 2 — Create a free Supabase account and project

1. Go to **https://supabase.com** -> **Start your project**.
2. Sign in (GitHub or email).
3. Click **New project**.
4. Name it `quantumroute`. For **Database Password**, click **Generate a password**
   and save it somewhere safe. Choose the region closest to you (India: Mumbai/
   South Asia, else Singapore).
5. **Create new project** and wait 1-2 minutes until it finishes provisioning.

---

## Step 3 — Get the project files onto your computer

If you received a zip: unzip it to your Desktop so you have a `quantumroute` folder.

If you're scaffolding from scratch, from your Desktop run:
```
npx create-next-app@14 quantumroute --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```
Accept defaults for any prompt (press Enter). Then:
```
cd quantumroute
npm install @supabase/supabase-js @supabase/ssr leaflet react-leaflet@4 recharts
npm install -D @types/leaflet
npx shadcn@latest init
npx shadcn@latest add button card input label select tabs
```

> **IMPORTANT — three known first-run breakages and how to avoid them.** The
> shadcn/Nova preset assumes Next.js 15 + Tailwind v4, but this project is Next 14
> + Tailwind v3. Before running the app: (1) ensure `src/app/layout.tsx` uses the
> `Inter` font from `next/font/google`, not `Geist` (Geist is Next-15 only);
> (2) ensure `src/app/globals.css` and `tailwind.config.ts` use Tailwind-v3 syntax
> (HSL CSS variables, standard color tokens) - if you see
> `border-border class does not exist`, they're still on v4 syntax; (3) install
> `react-leaflet@4`, not 5 (5 needs React 19). All three are fixed in the provided
> project files.

---

## Step 4 — Add your Supabase keys

In Supabase: **Project Settings** (gear icon) -> **API**. Copy the Project URL,
the `anon` `public` key, and the `service_role` key (click to reveal).

In the `quantumroute` folder, create a file named exactly **`.env.local`** with:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
No quotes, no spaces around `=`. Save.

> `.env.local` holds a secret admin key. It must never go to GitHub. The project's
> `.gitignore` already excludes it - confirm with `cat .gitignore | grep env`.

---

## Step 5 — Set up the database

1. Supabase -> **SQL Editor** -> **New query**.
2. Open `supabase/01_schema.sql` from the project, copy its ENTIRE contents, paste,
   and click **Run**. Expect "Success. No rows returned."

This creates the tables, the signup trigger (new users become Operators), the
**base grants** (required - see note below), and the Row-Level Security policies.

> **Why grants matter.** Supabase enforces Row-Level Security *on top of* normal
> Postgres table grants. Tables created via raw SQL do not get grants
> automatically, so the schema explicitly grants access to the `authenticated` and
> `service_role` roles. Without them, every query fails with
> `permission denied for table ...` even though the data exists. The provided
> schema includes all necessary grants.

---

## Step 6 — Turn off email confirmation (for easy testing)

Supabase -> **Authentication** -> **Providers** (or **Sign In / Providers**) ->
**Email** -> toggle **Confirm email** OFF -> Save. This lets you log in immediately
after signup without checking email. Fine for a demo; re-enable for production.

---

## Step 7 — Run the app locally

From the `quantumroute` folder:
```
npm run dev
```
Open **http://localhost:3000**. You'll be redirected to the login page.

Stop the server anytime with **Ctrl+C**; restart with `npm run dev`.

---

## Step 8 — Create your account and become Admin

1. On the site, click **Sign up**, use any email + a 6+ character password. You'll
   land on the dashboard as an **Operator**.
2. Promote yourself to Admin. Supabase -> SQL Editor -> run (use your signup email):
   ```
   update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
   select email, role from public.profiles;
   ```
   The select should show `admin`. If the update matched zero rows (still shows
   operator), promote by id instead:
   ```
   update public.profiles set role = 'admin'
   where id = (select id from auth.users order by created_at desc limit 1);
   ```
3. Reload the dashboard - you should now see **Admin** and an "Admin panel" button.

---

## Step 9 — Use it

1. **Admin panel** -> pick a preset (Small/Medium/Large) -> **Generate Network**.
   A grid appears on the Delhi map.
2. **Dashboard** -> **Run Optimization**. Metric cards fill in; the congestion map
   shows Baseline vs Optimized (toggle top-right). Run a few times to populate the
   trend chart.

---

## Step 10 — The ML pipeline (optional, standalone)

Separate from the web app. Requires Python 3.

```
cd ml
pip3 install -r requirements.txt --break-system-packages
python3 train.py
```
Expect five steps and an R2 around 0.90, then "Model saved to:
model/congestion_model.joblib". Optionally `python3 predict_demo.py` to see sample
predictions. Return to the project root with `cd ..`.

> **Mac note:** if `python3 train.py` fails with
> `libxgboost.dylib could not be loaded ... libomp.dylib`, XGBoost needs Apple's
> OpenMP runtime. Fix once with `brew install libomp`, then re-run. If `brew`
> itself is missing, install Homebrew first (https://brew.sh) or use a Python
> virtual environment.

---

## Common errors and what they mean

| What you see | Meaning | Fix |
|---|---|---|
| `'node' is not recognized` / `command not found` | Node not installed, or terminal not reopened after install | Reopen terminal; reinstall Node LTS if needed |
| `Unknown font 'Geist'` | shadcn preset assumed Next 15 | Use `Inter` from `next/font/google` in layout.tsx |
| `The 'border-border' class does not exist` | globals.css / tailwind.config on Tailwind v4 syntax | Use the provided v3 versions (HSL variables) |
| `ERESOLVE` installing react-leaflet | v5 needs React 19 | Install `react-leaflet@4` |
| `permission denied for table ...` | Missing base grants | Re-run `supabase/01_schema.sql` (includes grants) |
| Login says "Invalid API key" / "supabaseUrl is required" | `.env.local` wrong or server not restarted | Fix values, restart `npm run dev` |
| Dashboard shows role operator after promoting | Update matched no row, or session cached | Promote by id (Step 8); sign out and back in |
| `window is not defined` (map) | Leaflet rendered on server | Use the provided dynamic import wrapper (ssr:false) |
| Map tiles blank | Slow first OSM tile load | Refresh; check browser console |
| `libxgboost.dylib ... libomp.dylib` (Mac) | OpenMP runtime missing | `brew install libomp` |
| `npm audit` high/critical warnings | Normal in fresh Next projects, mostly build toolchain | Do NOT run `audit fix --force` (pulls React 19, breaks build) |
| Broken-image icons on default page | Starter page logos, unused | Harmless; those pages are replaced |
