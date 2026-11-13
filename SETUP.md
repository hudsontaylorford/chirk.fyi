# Getting the site live

About 30 minutes. You'll make three free accounts: GitHub (stores the code), Supabase (stores the RSVPs), and Vercel (runs the website). Do them in this order.

You'll come out of this with two secrets. Keep them in your password manager:
- **Database password** (from step 2)
- **Host password** (you pick it in step 3; it's what you and Molly type to open the host view)

---

## 1. GitHub: a home for the code

1. Go to **github.com** and sign up (or sign in).
2. Click the **+** in the top-right corner, then **New repository**.
3. Name it `event-kit`, choose **Private**, and leave every other box unchecked.
4. Click **Create repository**.
5. Send Claude the repository's name (e.g. `hudsonford/event-kit`). Claude uploads the code for you.

## 2. Supabase: the database

1. Go to **supabase.com**, click **Start your project**, and sign in with GitHub.
2. Click **New project**.
   - Name: `event-kit`
   - Database password: click **Generate a password**, then **copy it into your password manager now**.
   - Region: **East US (North Virginia)**
   - Click **Create new project** and wait about 2 minutes.
3. In the left sidebar, open **SQL Editor**.
4. Open `db/schema.sql` from the code on GitHub. Copy the whole file, paste it into the editor, and click **Run**. You should see "Success. No rows returned."
5. Click **+ New query**. Paste the whole of `db/seed-thanksgiving-2026.sql` and click **Run**. This creates Thanksgiving 2026.
6. Click the **Connect** button at the top of the page. Under **Transaction pooler**, copy the connection string. It starts with `postgresql://postgres.` and ends with `:6543/postgres`.
7. In that string, replace `[YOUR-PASSWORD]` with the database password from step 2 (remove the square brackets too). This is your **DATABASE_URL**. Keep it handy for the next section.

## 3. Vercel: the website

1. Go to **vercel.com** and sign up with GitHub. Pick the free **Hobby** plan.
2. Click **Add New… → Project**. Find `event-kit` and click **Import**. (If it's not listed, click "Adjust GitHub App Permissions" and give Vercel access to that repository.)
3. Before deploying, open **Environment Variables** and add two:
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the string from Supabase step 7 |
   | `ADMIN_PASSWORD` | a password you choose for the host view |
4. Click **Deploy** and wait about a minute.
5. You'll get an address like `event-kit-xyz.vercel.app`. Open `/thanksgiving-2026` on it from your phone.
6. Open `/thanksgiving-2026/host`, enter your host password, and you're in.

From then on, whenever Claude pushes changes to GitHub, Vercel updates the live site automatically within a minute or two.

## 4. A custom domain (optional, can wait)

1. In Vercel, open your project, then **Settings → Domains**.
2. Type the domain you want (e.g. `atthefords.com`). If it's available, Vercel lets you buy it right there, and the setup is automatic.
3. If you already own the domain somewhere else (Squarespace, GoDaddy...), Vercel shows you two DNS records to copy into that company's settings. Send Claude a screenshot if it's confusing.

Invite link: `https://yourdomain.com/thanksgiving-2026`

---

## Before you send invites

- In the host view, under **Main dishes**, assign anything that's already spoken for (e.g. Turkey & gravy → Hudson). Typing a new name creates that guest. Use **Copy their link** to send it to them.
- Check **Settings → Event details** and **Categories & soft caps**.
- Send yourself the invite link and RSVP once as a test. You can delete the test guest from the host view.
