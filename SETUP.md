# Setup: GitHub and a free test database

Everything here uses free plans. Supabase is the only service you need for the database.

## Part 1: put the code on GitHub

1. Unzip `42st-dashboard.zip` so you have a folder called `42st-dashboard`.
2. On github.com choose **New repository**. Name it `42st-dashboard`, choose **Private**, and leave "Add a README", ".gitignore" and "license" **unticked** (the folder already has them). Create it.
3. Open a terminal in the folder and run:

   ```bash
   git init -b main
   git add .
   git status        # check the list: there must be no src/config.js, node_modules or dist
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-NAME/42st-dashboard.git
   git push -u origin main
   ```

   If git asks for a name and email first: `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`.
   GitHub no longer accepts your account password on the command line. Sign in through the browser window git opens, or use the GitHub CLI: `gh auth login`, then `gh repo create 42st-dashboard --private --source=. --remote=origin --push` replaces the remote and push lines.
4. Refresh the repository page. The **Actions** tab should show a CI run that builds and tests the project.

Keep the repository private. GitHub Pages cannot publish from a private repository on the free plan, so host the built file elsewhere (Part 3).

## Part 2: a free Supabase database

1. Sign up at supabase.com, create an organization on the **Free** plan, then **New project**. Pick a name, a region near you and a database password (save it somewhere). Wait a couple of minutes for it to start.
2. Open **SQL Editor**, choose **New query**, paste the whole of `supabase/schema.sql` from the repository and press **Run**. Run it once only.
3. Open **Authentication**, then **URL Configuration**. Set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/**` to **Redirect URLs**. Email sign-in is on by default.
4. Open **Project Settings**, then **API Keys**. Copy the **Project URL** and the **publishable key** (starts `sb_publishable_`; older projects call it the `anon` key). Do not use the secret or `service_role` key in the app.
5. In the repository folder, copy `src/config.example.js` to `src/config.js` and fill in:

   ```js
   window.FS42_CONFIG = {
     supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
     supabaseAnonKey: 'sb_publishable_...',
     logoUrl: ''
   };
   ```

   `src/config.js` is ignored by git, so it will not be pushed.
6. Run `npm install` (first time only), then `npm run serve`. Open http://localhost:3000.
7. Enter your email, open the sign-in link from the email, and you land in a new workspace. Use **Add client** or **Load sample client**.
8. Check it worked: in Supabase open **Table Editor**. The `documents` table fills with rows and `members` shows you as `owner`.

The Supabase adapter has not been run against a live project yet. If a step fails, note the exact error text (browser console and the Supabase **Logs** page).

### Free plan limits to know

- Two free projects, 500 MB database each.
- A free project **pauses after 7 days without activity**. Open the Supabase dashboard and restore it. Check Supabase's current pause policy before relying on old test data.
- The built-in sign-in email sender is rate limited. If emails stop arriving, wait, or add your own SMTP server under Authentication.

### Testing alone first

A first sign-in creates its own organization. If a teammate signs in before being added to yours, they get a separate empty one, and the app does not yet let you choose between organizations. Test with one account until an invite screen exists.

## Part 3 (optional): host it so you can open it anywhere

Build with your keys in the environment, then upload the `dist` folder to a static host such as Netlify (drag and drop after logging in) or Cloudflare Pages.

```bash
# macOS or Linux
FS42_SUPABASE_URL=https://YOUR-PROJECT.supabase.co FS42_SUPABASE_KEY=sb_publishable_... npm run build

# Windows PowerShell
$env:FS42_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"; $env:FS42_SUPABASE_KEY="sb_publishable_..."; npm run build
```

Then add the hosted address to Supabase **Authentication**, **URL Configuration** (Site URL and Redirect URLs).

## Part 4 (later): live Google and Bing data

See `supabase/README.md`. It needs a Google Cloud project, Google's approvals and the edge functions deployed. None of that is needed to test the dashboard with CSV imports.
