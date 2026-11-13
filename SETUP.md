# Getting the site live

About 20 minutes. Everything happens in **Vercel**, which runs the website and also creates the database (Neon, free) for you. No separate database account to manage.

You'll pick one secret: the **host password** that you and Molly type to open the host page. Keep it in your password manager.

---

## 1. GitHub: a home for the code

Done: the code lives in `hudsontaylorford/chirk.fyi`.

## 2. Vercel: the website

1. Go to **vercel.com** and sign in with GitHub (the free **Hobby** plan is all you need).
2. Click **Add New… → Project**. Find `chirk.fyi` and click **Import**. (Not listed? Click "Adjust GitHub App Permissions" and give Vercel access to that repository.)
3. Open **Environment Variables** and add one:
   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | a password you choose for the host page |
4. Click **Deploy** and wait about a minute. The site won't work yet (it has no database), and that's expected.

## 3. Neon: the database (created from inside Vercel)

1. In your Vercel project, open the **Storage** tab, click **Create Database**, choose **Neon**, and accept the defaults. Free plan; pick the **US East** region if asked.
2. When it asks which project to connect, choose `chirk.fyi`. Vercel adds the database address (`DATABASE_URL`) to your project automatically.
3. Still in Storage, click **Open in Neon**, then **SQL Editor** in Neon's sidebar.
4. Open `db/schema.sql` on GitHub, copy the whole file, paste it into the editor, and click **Run**.
5. Clear the editor, paste the whole of `db/thanksgiving-2026.sql`, and click **Run**. This creates Thanksgiving 2026.
6. Back in Vercel: **Deployments** tab → the **⋯** menu on the latest one → **Redeploy**.
7. Open `your-project.vercel.app/thanksgiving-2026` on your phone. Then try `/thanksgiving-2026/host` with your host password.

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
