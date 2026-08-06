# Ledger — Supabase-backed To-Do List

A responsive to-do list with email/password auth, per-user task storage in
Postgres, priorities, due dates, search, filters, and dark mode. Plain HTML/CSS/JS
— no build step.

Files:
- `index.html` — markup
- `styles.css` — styling, theme, responsive layout
- `app.js` — Supabase client, auth, task CRUD, rendering
- `supabase-schema.sql` — database table + Row Level Security policies

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick an organization, name the project, set a database password, choose a region → **Create**.
3. Wait for provisioning to finish (~2 minutes).

## 2. Create the `tasks` table

1. In the Supabase dashboard, open **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase-schema.sql` from this project.
3. Click **Run**.

This creates the `tasks` table and Row Level Security (RLS) policies so each
user can only read/write their own rows.

## 3. Configure authentication

1. Go to **Authentication → Providers** and confirm **Email** is enabled (it is by default).
2. For local development, you can disable "Confirm email" under
   **Authentication → Sign In / Providers → Email** so you can sign up and log
   in immediately without checking an inbox. For production, leave email
   confirmation **on**.
3. Under **Authentication → URL Configuration**, set:
   - **Site URL**: your deployed URL (e.g. `https://your-app.vercel.app`) — you can
     update this after deploying in step 5.
   - **Redirect URLs**: add `http://localhost:3000` (or whatever port you use
     locally) and your Vercel URL.

## 4. Connect the app to your project

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `app.js` and replace the placeholders near the top:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

The anon key is safe to expose in client-side code — access is enforced by
the RLS policies from step 2, not by keeping this key secret.

## 5. Run it locally

Any static file server works, for example:

```bash
npx serve .
# or
python3 -m http.server 3000
```

Open the printed URL, sign up with an email/password, then log in and start
adding tasks.

---

## 6. Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
cd todo-app
vercel
```

Follow the prompts (accept defaults — this is a static site, no build command
needed). Vercel will give you a live URL.

### Option B — Vercel dashboard (Git-based)

1. Push this folder to a GitHub/GitLab/Bitbucket repo.
2. In [vercel.com](https://vercel.com), click **Add New → Project** and import the repo.
3. Framework preset: **Other** (static). Leave build command empty and output
   directory as `.` / root — Vercel will serve the static files directly.
4. Click **Deploy**.

### After deploying

Go back to Supabase → **Authentication → URL Configuration** and set:
- **Site URL** to your Vercel URL (e.g. `https://ledger-app.vercel.app`)
- Add the same URL to **Redirect URLs**

This ensures email confirmation links and auth redirects point to the right
place.

---

## Notes

- **Security**: tasks are protected by Postgres Row Level Security — the
  `anon` key alone can't read another user's rows; every query is scoped to
  `auth.uid()`.
- **Dark mode**: toggled via the sun/moon icon in the top bar, persisted in
  `localStorage`, and defaults to the visitor's OS preference on first visit.
- **Editing a task**: click the pencil icon to load it into the composer at
  the top; the "Add" button becomes "Save" until you submit or add a new task.
- **Extending**: to add task descriptions, tags, or reminders, add columns to
  `tasks` in `supabase-schema.sql`, then wire them into the form in
  `index.html` and the insert/update calls in `app.js`.
