"use client";
import { useState } from "react";
import Icon from "./Icons";
import { embedSrc, FONTS } from "@/lib/links/defaults";

const FONT_VAR = { grotesk: "var(--f-grotesk)", poppins: "var(--f-poppins)", serif: "var(--f-serif)" };

function Signup({ block, preview }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (preview) return;
    setState("busy");
    const r = await fetch("/links/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setState("done"); setMsg("You're in! Thanks for joining."); }
    else { setState("idle"); setMsg(j.error || "Something went wrong"); }
  }
  return (
    <div className="card signup">
      <h3>{block.title}</h3>
      {block.subtitle && <p>{block.subtitle}</p>}
      {state === "done" ? (
        <p className="ok">{msg}</p>
      ) : (
        <form onSubmit={submit}>
          <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <button disabled={state === "busy"}>{state === "busy" ? "..." : "Join"}</button>
        </form>
      )}
      {state !== "done" && msg && <p className="err">{msg}</p>}
    </div>
  );
}

function Block({ b, preview }) {
  const href = preview ? undefined : `/links/go/${b.id}`;
  if (b.type === "header") return <h2 className="section">{b.title}</h2>;
  if (b.type === "signup") return <Signup block={b} preview={preview} />;
  if (b.type === "embed") {
    const src = embedSrc(b.url);
    return (
      <div className="card embed">
        {b.title && <h3>{b.title}</h3>}
        {src ? (
          <iframe src={src} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen title={b.title || "Embed"} />
        ) : (
          <p className="err">Unsupported embed URL (use YouTube, Spotify or Vimeo)</p>
        )}
      </div>
    );
  }
  if (b.type === "featured") {
    return (
      <a className="card featured" href={href} target="_blank" rel="noopener noreferrer" style={b.image ? { backgroundImage: `linear-gradient(transparent 20%, rgba(0,0,0,.75)), url(${b.image})` } : undefined}>
        <span className="tag">Featured</span>
        <strong>{b.title}</strong>
        {b.subtitle && <span>{b.subtitle}</span>}
      </a>
    );
  }
  return (
    <a className="card link" href={href} target="_blank" rel="noopener noreferrer">
      {b.image && <img src={b.image} alt="" />}
      <span className="lt"><strong>{b.title}</strong>{b.subtitle && <small>{b.subtitle}</small>}</span>
      <span className="arrow">→</span>
    </a>
  );
}

export default function LinkPage({ config, preview = false }) {
  const { brand, theme, layout, socials, blocks } = config;
  const c = theme.colors;
  const style = {
    "--bg1": c.bg1, "--bg2": c.bg2, "--a1": c.accent1, "--a2": c.accent2, "--tx": c.text,
    fontFamily: FONT_VAR[theme.font] || FONT_VAR.grotesk,
  };
  const light = theme.preset === "candy";
  return (
    <div className={`lp ${layout === "bento" ? "bento" : "col"} ${light ? "lightish" : ""}`} style={style}>
      <div className="blob b1" /><div className="blob b2" />
      <main>
        <header>
          <div className="avatar">
            {brand.avatar ? <img src={brand.avatar} alt={brand.name} /> : <span>{(brand.name || "?").slice(0, 1).toUpperCase()}</span>}
          </div>
          <h1>{brand.name}</h1>
          {brand.bio && <p className="bio">{brand.bio}</p>}
          {socials.length > 0 && (
            <nav className="socials" aria-label="Social links">
              {socials.map((s, i) => (
                <a key={i} href={preview ? undefined : `/links/go/social-${i}`} target="_blank" rel="noopener noreferrer" aria-label={s.type}>
                  <Icon type={s.type} />
                </a>
              ))}
            </nav>
          )}
        </header>
        <section className="blocks">
          {blocks.filter((b) => b.enabled !== false).map((b) => (
            <div key={b.id} className={`cell sz-${b.size || "m"} t-${b.type}`}><Block b={b} preview={preview} /></div>
          ))}
        </section>
        <footer>Made with LinkHub</footer>
      </main>
    </div>
  );
}
