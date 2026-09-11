# QuantumRoute — Deployment (Vercel)

Deploy only after the app runs correctly on your computer (SETUP_INSTRUCTIONS.md).
The whole app (frontend + API routes) deploys as ONE Vercel project. The only
external service is Supabase, already running in the cloud - you don't deploy it,
you point Vercel at it with environment variables.

The `ml/` pipeline is NOT deployed - it's a standalone local tool.

---

## Part A — Put the project on GitHub

Vercel deploys from a GitHub repo.

1. Create a free account at **https://github.com**.
2. Install **GitHub Desktop** from https://desktop.github.com (avoids git commands).
3. GitHub Desktop -> **File -> Add local repository** -> select your `quantumroute`
   folder. If prompted that it isn't a repo yet, click **create a repository**.
4. Name it `quantumroute`, **Create repository**.
5. **Before committing, confirm `.env.local` is NOT in the file list.** It holds
   your secret service-role key and must never be committed. The `.gitignore`
   already excludes it; if you see it listed, stop and fix `.gitignore` first.
6. Add a commit summary, **Commit to main**, then **Publish repository** (private is
   fine).

---

## Part B — Deploy to Vercel

### B1. Create the project
1. Go to **https://vercel.com** -> Sign Up -> **Continue with GitHub** -> authorize.
2. Dashboard -> **Add New... -> Project**.
3. Find `quantumroute` -> **Import**.
4. Vercel auto-detects Next.js. Leave build settings at defaults.

### B2. Set environment variables (the step people forget)
Before clicking Deploy, expand **Environment Variables** and add all three from
your local `.env.local`, exactly:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | same as local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as local |
| `SUPABASE_SERVICE_ROLE_KEY` | same as local |

> A missing or misspelled variable here is the #1 cause of "works locally, breaks
> when deployed." Double-check spelling.

### B3. Deploy
Click **Deploy**, wait 1-3 minutes, then **Visit** the live `*.vercel.app` URL.

---

## Part C — Verify the live version

On the live URL (not localhost):
1. Login page loads.
2. You can sign up / log in (proves Supabase env vars are correct in Vercel).
3. Admin can generate a network + traffic.
4. "Run Optimization" completes; metrics + heat map render.
5. The trend chart shows your runs.

If all five pass, you're deployed.

---

## Part D — "Works locally but not on Vercel"

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank load / "supabaseUrl is required" / login fails | Env vars missing/misspelled in Vercel | Settings -> Environment Variables; fix; redeploy (Part E) |
| Login works, "Run Optimization" errors server-side | `SUPABASE_SERVICE_ROLE_KEY` missing in Vercel | Add it; redeploy |
| Data won't save / permission denied | Schema/grants not applied, or pointing at a different Supabase project | Confirm Vercel's `NEXT_PUBLIC_SUPABASE_URL` matches the project where you ran the SQL |
| Build fails on a TypeScript/lint error that didn't stop local dev | `next build` (Vercel) is stricter than `next dev` | Read the first error line in the build log; fix; push |
| Optimization times out on Vercel | Free-tier function time limit | Use the provided presets only (sized to fit) |
| Map tiles blank on first load | Slow OSM tile fetch | Refresh; check console |

---

## Part E — Redeploying after changes

- **Code change:** GitHub Desktop -> Commit to main -> Push origin. Vercel
  auto-deploys within seconds.
- **Env var change only:** Vercel -> Deployments -> latest -> ... -> **Redeploy**.
  Env var changes do NOT take effect until you redeploy.

---

## Part F — Free-tier limits (so nothing surprises you on demo day)

- **Vercel**: serverless functions have a ~10s execution ceiling (Hobby plan). Our
  presets finish well under this. Don't exceed the provided presets on the deployed
  version.
- **Supabase**: free projects pause after ~1 week of inactivity. Before a demo,
  open the Supabase dashboard to un-pause and do one test login a few hours ahead.
