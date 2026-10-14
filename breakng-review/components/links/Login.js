"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  async function submit(e) {
    e.preventDefault();
    const r = await fetch("/links/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.reload();
    else setErr((await r.json().catch(() => ({}))).error || "Login failed");
  }
  return (
    <div className="login">
      <form onSubmit={submit}>
        <h2>Admin login</h2>
        <input type="password" autoFocus placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn">Sign in</button>
        {err && <small style={{ color: "#ff7a7a" }}>{err}</small>}
      </form>
    </div>
  );
}
