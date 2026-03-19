# gdurls-clone

A private **Google Drive** (or any URL) shortlink generator with click
tracking, built with **Next.js**, **Postgres** (Neon), and deployed on **Vercel**.

Create short links, track click activity, manage links from a dashboard,
and protect admin functionality with simple authentication.

<img src="https://raw.githubusercontent.com/monapdx/gdurls-clone/refs/heads/main/screenshot.png">

<img src="https://raw.githubusercontent.com/monapdx/gdurls-clone/refs/heads/main/dashboard.png">

------------------------------------------------------------------------

## ✨ Features

-   🔗 Generate short links for any URL
-   📊 Click tracking (stored in Postgres)
-   📈 Live stats (total clicks + recent activity)
-   🗂 Dashboard view of all links
-   📋 Copy short link button
-   🗑 Delete links (cascades delete clicks)
-   🔐 Private admin mode (HTTP Basic Auth)
-   🚀 Production-ready on Vercel

------------------------------------------------------------------------

## 🛠 Tech Stack

-   **Next.js (App Router)**
-   **TypeScript**
-   **Neon Postgres**
-   **Vercel Serverless**
-   **Node crypto (for hashing IPs)**

------------------------------------------------------------------------

## 🚀 Local Development

### 1. Clone the repo

``` bash
git clone https://github.com/yourusername/gdurls-clone.git
cd gdurls-clone
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Create `.env.local`

``` env
DATABASE_URL=your_neon_connection_string
GDURLS_SALT=your_random_string
BASE_URL=http://localhost:3000

ADMIN_USER=admin
ADMIN_PASSWORD=your_password
```

### 4. Create database tables (Neon SQL)

``` sql
create table if not exists links (
  code text primary key,
  target_url text not null,
  created_at timestamptz default now(),
  drive_file_id text,
  drive_title text
);

create table if not exists clicks (
  id bigserial primary key,
  code text not null references links(code) on delete cascade,
  ts timestamptz default now(),
  referrer text,
  user_agent text,
  ip_hash text
);
```

### 5. Start dev server

``` bash
npm run dev
```

Open:

http://localhost:3000

------------------------------------------------------------------------

## 🌍 Deployment (Vercel)

1.  Push to GitHub\
2.  Import repo into Vercel\
3.  Add environment variables in Vercel:

DATABASE_URL\
GDURLS_SALT\
BASE_URL=https://your-project.vercel.app\
ADMIN_USER\
ADMIN_PASSWORD

4.  Deploy

------------------------------------------------------------------------

## 🔐 Private Admin Mode

Admin routes are protected via HTTP Basic Auth:

-   `/dashboard`
-   `/api/links`
-   `/api/links/[code]`

Public routes:

-   `/x/[code]` (redirects remain public)

------------------------------------------------------------------------

## 📡 API Endpoints

### Create Link

POST /api/links\
Body: { "url": "https://example.com" }

### Get Stats

GET /api/links/:code

### Delete Link

DELETE /api/links/:code

### Redirect

GET /x/:code

------------------------------------------------------------------------

## 🧠 How It Works

-   Short codes are generated using secure random bytes.
-   Click events are stored in Postgres.
-   IP addresses are hashed with a salt before storage.
-   Dashboard is server-rendered for performance.
-   Middleware enforces admin-only access to management routes.

------------------------------------------------------------------------

## 🛡 Security Notes

-   IPs are hashed before storage.
-   Admin routes require credentials.
-   Shortlinks are public but do not expose the database.
-   Always keep `.env.local` out of version control.

------------------------------------------------------------------------

## 📄 License

MIT
