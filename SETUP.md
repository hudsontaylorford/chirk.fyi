# Getting the site live

About 20 minutes. Everything happens in **Vercel**, which runs the website and also creates the database (Neon, free) for you. No separate database account to manage.

You'll pick one secret, `ADMIN_PASSWORD`. Hosts now sign in with their email and a 6-digit code, so nobody types it day to day. It only claims events made before accounts existed, and it signs everyone's sign-in cookie, so **never delete it** from Vercel (changing it signs every host out).

---

## 1. GitHub: a home for the code

Done: the code lives in `hudsontaylorford/chirk.fyi`.

## 2. Vercel: the website

1. Go to **vercel.com** and sign in with GitHub (the free **Hobby** plan is all you need).
2. Click **Add New… → Project**. Find `chirk.fyi` and click **Import**. (Not listed? Click "Adjust GitHub App Permissions" and give Vercel access to that repository.)
3. Open **Environment Variables** and add one:
   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | a long secret you choose (see above; keep it, never delete it) |
4. Click **Deploy** and wait about a minute. The site won't work yet (it has no database), and that's expected.

## 3. Neon: the database (created from inside Vercel)

1. In your Vercel project, open the **Storage** tab, click **Create Database**, choose **Neon**, region **Washington, D.C. (East)**, and turn **Auth** off.
2. Connect it to `chirk.fyi`. **Important:** in **Custom Prefix**, type `DATABASE` so the setting is named `DATABASE_URL` (the default `STORAGE` won't work).
3. Click the database, then **Query** in its sidebar. Turn off **Read-only**.
4. Paste the whole of `db/schema.sql` and click **Run**.
5. Clear the editor, paste `db/thanksgiving-2026.sql`, and click **Run**.
6. Back in the project: **Deployments** tab → **⋯** on the latest one → **Redeploy**.
7. Open `your-project.vercel.app/thanksgiving-2026` on your phone. Then open `/host`, sign in with your email and the code chirk emails you. (The very first time, tap "Have the old host password?", enter `ADMIN_PASSWORD`, then your email: every existing event becomes yours.)

**Co-hosts:** on an event's host page, "+ Add a co-host" with their email. They sign in at `chirk.fyi/host` with that email. Only the owner can remove co-hosts or delete the event. Anyone on an event's guest list (with an email) can also sign in and host their own events; nobody else can.

From then on, whenever Claude pushes changes to GitHub, Vercel updates the live site automatically within a minute or two.

## 4. Your Cloudflare domain

The website stays on Vercel, and Cloudflare just points your domain at it. Below, `chirk.fyi` stands for your real domain.

1. In **Vercel**, open the project, then **Settings → Domains**. Type `chirk.fyi` and click **Add**. Choose the option that also adds `www`.
2. Vercel then shows a short list of DNS records, usually an **A** record for `@` and a **CNAME** for `www`. Leave that page open.
3. In **Cloudflare**, open your domain, then **DNS → Records**.
   - If records for `@` or `www` already exist, edit those. Otherwise click **Add record**.
   - Copy the **Type**, **Name** and **Value/Target** exactly as Vercel shows them.
   - Set **Proxy status** to **DNS only** (the grey cloud, not orange). Vercel needs this to issue the security certificate.
4. Back in Vercel, within a few minutes both domains should show **Valid Configuration**.

The home page `chirk.fyi` is a plain placeholder for now. The event lives at `chirk.fyi/thanksgiving-2026`, and that's the link you send out.

If anything shows red, send Claude a screenshot of the Vercel Domains page and the Cloudflare DNS page.

---

## Before you send invites

- RSVP yourself first, as a test and to claim anything you're making.
- Open `chirk.fyi/thanksgiving-2026/host`, check **Edit event**, and add or remove items in the **Needed list**.
- Paste `chirk.fyi/thanksgiving-2026` into the group text.
