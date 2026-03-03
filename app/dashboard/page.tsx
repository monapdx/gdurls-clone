import Link from "next/link";
import { sql } from "../../lib/db";
import CopyButton from "../components/CopyButton";
import DeleteButton from "../components/DeleteButton";

export const runtime = "nodejs";

type Row = {
  code: string;
  target_url: string;
  created_at: string;
  drive_file_id: string | null;
  drive_title: string | null;
  clicks: number;
  last_click: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function truncate(s: string, n = 80) {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams?.q ?? "").trim();
  const like = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;

  const rows = await sql<Row[]>`
    select
      l.code,
      l.target_url,
      l.created_at,
      l.drive_file_id,
      l.drive_title,
      coalesce(count(c.id), 0)::int as clicks,
      max(c.ts) as last_click
    from links l
    left join clicks c on c.code = l.code
    where ${q === ""} 
       or (l.code ilike ${like} or l.target_url ilike ${like})
    group by 
      l.code, 
      l.target_url, 
      l.created_at,
      l.drive_file_id,
      l.drive_title
    order by l.created_at desc
    limit 200
  `;

  const base =
    (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

  return (
    <main className="wrap">
      <header className="header">
        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
          <h1 className="title">Dashboard</h1>
          <Link className="link" href="/">
            ← Back
          </Link>
        </div>

        <p className="subtitle">All created shortlinks with click totals.</p>
      </header>

      <section className="card">
        <form method="get" style={{ display: "grid", gap: 10 }}>
          <label className="label" htmlFor="q">
            Search (code or URL)
          </label>

          <div className="row">
            <input
              id="q"
              name="q"
              className="input"
              defaultValue={q}
              placeholder="e.g. Ysj2CjU or drive.google.com"
              autoComplete="off"
            />
            <button className="btn" type="submit">
              Search
            </button>
          </div>

          {q && (
            <div className="muted">
              Showing results for <span className="mono">{q}</span>.{" "}
              <Link className="link" href="/dashboard">
                Clear
              </Link>
            </div>
          )}
        </form>
      </section>

      <section className="card">
        <div className="statsHeader">
          <h2 className="h2" style={{ margin: 0 }}>
            Links ({rows.length})
          </h2>
        </div>

        {rows.length === 0 ? (
          <p className="muted">No links yet.</p>
        ) : (
          <div className="table" style={{ marginTop: 12 }}>
            <div
              className="thead"
              style={{
                gridTemplateColumns: "210px 1fr 80px 180px 110px",
              }}
            >
              <div>Short Link</div>
              <div>Title / Target</div>
              <div>Clicks</div>
              <div>Last Click</div>
              <div>Actions</div>
            </div>

            {rows.map((r) => {
              const shortUrl = `${base}/x/${r.code}`;

              return (
                <div
                  key={r.code}
                  className="trow"
                  style={{
                    gridTemplateColumns: "210px 1fr 80px 180px 110px",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <a
                      className="link mono"
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {r.code}
                    </a>
                    <CopyButton text={shortUrl} />
                  </div>

                  <div>
                    {r.drive_title ? (
                      <div>
                        <div className="mono">{truncate(r.drive_title)}</div>
                        <div className="small muted">{truncate(r.target_url)}</div>
                      </div>
                    ) : (
                      <div className="mono small">{truncate(r.target_url)}</div>
                    )}
                  </div>

                  <div className="mono">{r.clicks}</div>

                  <div className="mono small">{formatDate(r.last_click)}</div>

                  <div>
                    <DeleteButton code={r.code} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}