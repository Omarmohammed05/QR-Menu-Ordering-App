# Deployment — Neon + Vercel

ADR-001: the same committed `drizzle/` migrations run locally and in production; only the connection string differs.

## 1. Neon (database)

1. Create a project at [console.neon.tech](https://console.neon.tech) — pick the region closest to your users from the console's dropdown (Neon has no Egypt region; Frankfurt `aws-eu-central-1` is typically the closest).
2. Copy the **connection string** — this is the production `DATABASE_URL`.
3. Apply migrations from any machine that can reach Neon:

   ```bash
   DATABASE_URL="<neon-connection-string>" pnpm exec drizzle-kit migrate
   ```

## 2. Vercel (app)

Either connect the GitHub repo in the Vercel dashboard, or use the CLI (`vercel link`). The production build needs these environment variables (Project → Settings → Environment Variables):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon connection string from step 1 |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` (32+ chars) |
| `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` — the origin QR codes, sitemap and OG tags are built from |
| `AUTH_URL` | `https://<your-domain>` |
| `IMGBB_API_KEY` | imgbb key (image uploads fail silently without it) |
| `PLATFORM_OWNER_EMAIL` | gates the admin page and restaurant creation |

Deploy (`vercel deploy --prod` or push to the connected branch). After the first deploy you know the domain — set `NEXT_PUBLIC_APP_URL`/`AUTH_URL` and redeploy so QR codes and canonicals point at the final origin.

## 3. First-run checklist

1. `GET /api/health` returns 200 (it pings the DB — a constant 200 means it is broken).
2. Sign in with the platform-owner account, create a restaurant from the admin page, issue the owner claim link.
3. Open the restaurant dashboard → Tables: print the QR codes — they encode `<NEXT_PUBLIC_APP_URL>/<slug>?t=<table-token>`.
4. Scan with a phone, place a test order, confirm the WhatsApp handoff.
