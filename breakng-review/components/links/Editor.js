"use client";
import { useEffect, useState } from "react";
import LinkPage from "./LinkPage";
import { PRESETS, FONTS, SOCIAL_TYPES } from "@/lib/links/defaults";

const BLOCK_TYPES = { link: "Link button", featured: "Featured card", embed: "Embed (YouTube/Spotify/Vimeo)", signup: "Email signup", header: "Section heading" };
const uid = () => "b" + Math.random().toString(36).slice(2, 8);

export default function Editor({ initial, persistent }) {
  const [cfg, setCfg] = useState(initial);
  const [tab, setTab] = useState("links");
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (tab === "stats") fetch("/links/api/stats").then((r) => r.json()).then(setStats);
  }, [tab]);

  const set = (patch) => setCfg((c) => ({ ...c, ...patch }));
  const setBlock = (i, patch) => set({ blocks: cfg.blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const move = (arr, i, d) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };

  async function save() {
    setStatus("Saving...");
    const r = await fetch("/links/api/config", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(cfg) });
    const j = await r.json().catch(() => ({}));
    setStatus(r.ok ? "Saved ✓" : j.error || "Save failed");
    setTimeout(() => setStatus(""), 3000);
  }
  async function logout() {
    await fetch("/links/api/logout", { method: "POST" });
    location.reload();
  }

  const applyPreset = (key) =>
    set({ theme: { ...cfg.theme, preset: key, custom: false, colors: { ...PRESETS[key] } } });
  const setColor = (k, v) => set({ theme: { ...cfg.theme, custom: true, colors: { ...cfg.theme.colors, [k]: v } } });

  return (
    <div className="adm">
      <div className="bar">
        <h1>LinkHub admin</h1>
        <span>{status}</span>
        <a className="btn ghost" href="/links" target="_blank">View page</a>
        <button className="btn" onClick={save}>Save</button>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </div>
      {!persistent && (
        <div className="note">
          Saving isn&apos;t permanent yet: add the free Upstash Redis integration in Vercel (Storage tab) and redeploy. Until then edits reset on redeploy and analytics won&apos;t persist.
        </div>
      )}
      <div className="tabs">
        {[["links", "Links"], ["brand", "Brand & socials"], ["theme", "Theme & layout"], ["stats", "Analytics"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="wrap">
        <div>
          {tab === "brand" && (
            <>
              <div className="panel">
                <h2>Brand</h2>
                <label>Brand name</label>
                <input value={cfg.brand.name} onChange={(e) => set({ brand: { ...cfg.brand, name: e.target.value } })} />
                <label>Bio / tagline</label>
                <textarea value={cfg.brand.bio} onChange={(e) => set({ brand: { ...cfg.brand, bio: e.target.value } })} />
                <label>Logo / avatar image URL</label>
                <input placeholder="https://..." value={cfg.brand.avatar} onChange={(e) => set({ brand: { ...cfg.brand, avatar: e.target.value } })} />
              </div>
              <div className="panel">
                <h2>Social icons</h2>
                {cfg.socials.map((s, i) => (
                  <div className="row" key={i} style={{ marginBottom: 8 }}>
                    <select className="fit" style={{ flex: "0 0 130px" }} value={s.type} onChange={(e) => set({ socials: cfg.socials.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)) })}>
                      {SOCIAL_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <input placeholder={s.type === "email" ? "you@brand.com" : "https://..."} value={s.url} onChange={(e) => set({ socials: cfg.socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                    <button className="btn ghost small fit" onClick={() => set({ socials: move(cfg.socials, i, -1) })}>↑</button>
                    <button className="btn danger small fit" onClick={() => set({ socials: cfg.socials.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                ))}
                <button className="btn ghost" onClick={() => set({ socials: [...cfg.socials, { type: "instagram", url: "" }] })}>+ Add social</button>
              </div>
            </>
          )}

          {tab === "links" && (
            <div className="panel">
              <h2>Blocks</h2>
              {cfg.blocks.map((b, i) => (
                <div key={b.id} className={`item ${b.enabled === false ? "off" : ""}`}>
                  <div className="head">
                    <b>{b.title || "(untitled)"} <small style={{ color: "#a99bc4" }}>· {BLOCK_TYPES[b.type]}</small></b>
                    <button className="btn ghost small" onClick={() => set({ blocks: move(cfg.blocks, i, -1) })}>↑</button>
                    <button className="btn ghost small" onClick={() => set({ blocks: move(cfg.blocks, i, 1) })}>↓</button>
                    <button className="btn ghost small" onClick={() => setBlock(i, { enabled: b.enabled === false })}>{b.enabled === false ? "Show" : "Hide"}</button>
                    <button className="btn danger small" onClick={() => confirm("Delete this block?") && set({ blocks: cfg.blocks.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                  <div className="row">
                    <div>
                      <label>Type</label>
                      <select value={b.type} onChange={(e) => setBlock(i, { type: e.target.value })}>
                        {Object.entries(BLOCK_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Bento size</label>
                      <select value={b.size || "m"} onChange={(e) => setBlock(i, { size: e.target.value })}>
                        <option value="s">Small (1/4)</option><option value="m">Medium (1/2)</option><option value="l">Full width</option>
                      </select>
                    </div>
                  </div>
                  <label>Title</label>
                  <input value={b.title} onChange={(e) => setBlock(i, { title: e.target.value })} />
                  {(b.type === "link" || b.type === "featured" || b.type === "signup") && (
                    <>
                      <label>Subtitle</label>
                      <input value={b.subtitle || ""} onChange={(e) => setBlock(i, { subtitle: e.target.value })} />
                    </>
                  )}
                  {b.type !== "signup" && b.type !== "header" && (
                    <>
                      <label>{b.type === "embed" ? "Video / playlist URL" : "Link URL"}</label>
                      <input placeholder="https://..." value={b.url} onChange={(e) => setBlock(i, { url: e.target.value })} />
                    </>
                  )}
                  {(b.type === "link" || b.type === "featured") && (
                    <>
                      <label>Image URL (optional)</label>
                      <input placeholder="https://..." value={b.image || ""} onChange={(e) => setBlock(i, { image: e.target.value })} />
                    </>
                  )}
                </div>
              ))}
              <button className="btn" onClick={() => set({ blocks: [...cfg.blocks, { id: uid(), type: "link", title: "New link", subtitle: "", url: "https://", image: "", size: "m", enabled: true }] })}>+ Add block</button>
            </div>
          )}

          {tab === "theme" && (
            <>
              <div className="panel">
                <h2>Layout</h2>
                <div className="row">
                  {[["column", "Centered column"], ["bento", "Bento grid"]].map(([k, l]) => (
                    <button key={k} className={`btn ${cfg.layout === k ? "" : "ghost"}`} onClick={() => set({ layout: k })}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="panel">
                <h2>Palette</h2>
                <div className="row">
                  {Object.entries(PRESETS).map(([k, p]) => (
                    <button key={k} className={`btn ${cfg.theme.preset === k && !cfg.theme.custom ? "" : "ghost"}`} onClick={() => applyPreset(k)}>{p.label}</button>
                  ))}
                </div>
                <h2 style={{ marginTop: 16 }}>Custom colors</h2>
                <div className="row">
                  {[["bg1", "Background 1"], ["bg2", "Background 2"], ["accent1", "Accent 1"], ["accent2", "Accent 2"], ["text", "Text"]].map(([k, l]) => (
                    <div key={k}><label>{l}</label><input type="color" value={cfg.theme.colors[k]} onChange={(e) => setColor(k, e.target.value)} /></div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <h2>Font</h2>
                <select value={cfg.theme.font} onChange={(e) => set({ theme: { ...cfg.theme, font: e.target.value } })}>
                  {Object.entries(FONTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            </>
          )}

          {tab === "stats" && (
            <>
              <div className="panel">
                <h2>Clicks per link</h2>
                {!stats ? "Loading..." : (() => {
                  const rows = [
                    ...cfg.blocks.filter((b) => b.url).map((b) => ({ id: b.id, name: b.title })),
                    ...cfg.socials.map((s, i) => ({ id: `social-${i}`, name: `Social: ${s.type}` })),
                  ].map((r) => ({ ...r, n: Number(stats.clicks[r.id] || 0) }));
                  const max = Math.max(1, ...rows.map((r) => r.n));
                  return (
                    <table>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id}><td>{r.name}</td><td style={{ width: "40%" }}><div className="bar-fill" style={{ width: `${(r.n / max) * 100}%`, minWidth: 4 }} /></td><td>{r.n}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
              <div className="panel">
                <h2>Email signups ({stats ? stats.subscribers.length : "..."})</h2>
                {stats && stats.subscribers.length === 0 && <small>No signups yet.</small>}
                {stats && stats.subscribers.length > 0 && (
                  <>
                    <table><tbody>{stats.subscribers.slice(0, 50).map((s, i) => <tr key={i}><td>{s.email}</td><td>{new Date(s.at).toLocaleDateString()}</td></tr>)}</tbody></table>
                    <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => {
                      const blob = new Blob(["email,date\n" + stats.subscribers.map((s) => `${s.email},${s.at}`).join("\n")], { type: "text/csv" });
                      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "subscribers.csv"; a.click();
                    }}>Download CSV</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="prev">
          <div className="frame"><LinkPage config={cfg} preview /></div>
        </aside>
      </div>
    </div>
  );
}
