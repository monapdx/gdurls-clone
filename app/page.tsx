"use client";

import React, { useEffect, useMemo, useState } from "react";

type CreateResp = {
  code: string;
  short_url: string;
  target_url: string;
};

type StatsResp = {
  link: { code: string; target_url: string; created_at: string };
  clicks: number;
  recent: { ts: string; referrer: string | null; user_agent: string | null }[];
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateResp | null>(null);

  const [stats, setStats] = useState<StatsResp | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  const code = created?.code ?? null;
  const shortLink = useMemo(() => created?.short_url ?? "", [created]);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setCreateErr(null);
    setStatsErr(null);
    setStats(null);
    setCreating(true);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Create failed");
      }

      const data = (await res.json()) as CreateResp;
      setCreated(data);
    } catch (err: any) {
      setCreateErr(err?.message ?? String(err));
    } finally {
      setCreating(false);
    }
  }

  async function refreshStats(c: string) {
    try {
      const res = await fetch(`/api/links/${encodeURIComponent(c)}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Stats failed");
      }

      const data = (await res.json()) as StatsResp;
      setStats(data);
      setStatsErr(null);
    } catch (err: any) {
      setStatsErr(err?.message ?? String(err));
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  useEffect(() => {
    if (!code) return;

    refreshStats(code);
    const t = setInterval(() => refreshStats(code), 3000);
    return () => clearInterval(t);
  }, [code]);

  return (
    <main className="wrap">
      <header className="header">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h1 className="title">Track Google Drive Clicks</h1>
            <p className="subtitle">
              Create short links and track click activity.
            </p>
          </div>

          <a className="btnSecondary" href="/dashboard">
            Dashboard
          </a>
        </div>
      </header>

      <section className="card">
        <form onSubmit={createLink} className="form">
          <label className="label" htmlFor="url">
            Google Drive URL (or any URL)
          </label>

          <div className="row">
            <input
              id="url"
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              autoComplete="off"
              required
            />
            <button className="btn" type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </button>
          </div>

          {createErr && <p className="error">{createErr}</p>}
        </form>
      </section>

      {created && (
        <section className="card">
          <h2 className="h2">Your Short Link</h2>

          <div className="resultRow">
            <a
              className="link"
              href={shortLink}
              target="_blank"
              rel="noreferrer"
            >
              {shortLink}
            </a>

            <button
              className="btnSecondary"
              onClick={() => copy(shortLink)}
            >
              Copy
            </button>
          </div>

          <div className="meta">
            <div>
              <div className="metaLabel">Code</div>
              <div className="mono">{created.code}</div>
            </div>

            <div>
              <div className="metaLabel">Target URL</div>
              <div className="mono">{created.target_url}</div>
            </div>
          </div>
        </section>
      )}

      {created && (
        <section className="card">
          <div className="statsHeader">
            <h2 className="h2">Live Stats</h2>
            <button
              className="btnSecondary"
              onClick={() => refreshStats(created.code)}
            >
              Refresh
            </button>
          </div>

          {statsErr && <p className="error">{statsErr}</p>}

          {stats ? (
            <>
              <div className="bigNumber">
                <div className="bigLabel">Clicks</div>
                <div className="bigValue">{stats.clicks}</div>
              </div>

              <h3 className="h3">Recent Clicks</h3>

              {stats.recent.length === 0 ? (
                <p className="muted">No clicks yet.</p>
              ) : (
                <div className="table">
                  <div className="thead">
                    <div>Time</div>
                    <div>User Agent</div>
                  </div>

                  {stats.recent.map((r, i) => (
                    <div className="trow" key={i}>
                      <div className="mono">{formatDate(r.ts)}</div>
                      <div className="mono small">
                        {r.user_agent ?? "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="muted">Loading stats…</p>
          )}
        </section>
      )}
    </main>
  );
}