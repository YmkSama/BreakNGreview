export const PRESETS = {
  sunset: { label: "Neon Sunset", bg1: "#12051f", bg2: "#3a0a4d", accent1: "#ff2e93", accent2: "#ff9a3c", text: "#ffffff" },
  ocean: { label: "Electric Ocean", bg1: "#021a2e", bg2: "#0b3a7a", accent1: "#00e0ff", accent2: "#8a5cff", text: "#ffffff" },
  candy: { label: "Candy Pop", bg1: "#fff6c9", bg2: "#ffd6ec", accent1: "#ff4fa3", accent2: "#19d3a2", text: "#1a1030" },
};

export const FONTS = { grotesk: "Space Grotesk", poppins: "Poppins", serif: "Fraunces" };

export const SOCIAL_TYPES = ["instagram", "x", "youtube", "tiktok", "facebook", "linkedin", "github", "twitch", "spotify", "email", "website"];

export const DEFAULT_CONFIG = {
  brand: {
    name: "Your Brand",
    bio: "Bold products. Big energy. Everything we do, in one place.",
    avatar: "",
  },
  layout: "column",
  theme: { preset: "sunset", font: "grotesk", custom: false, colors: { ...PRESETS.sunset } },
  socials: [
    { type: "instagram", url: "https://instagram.com/" },
    { type: "x", url: "https://x.com/" },
    { type: "youtube", url: "https://youtube.com/" },
    { type: "email", url: "hello@example.com" },
  ],
  blocks: [
    { id: "b1", type: "featured", title: "Shop the new collection", subtitle: "Limited drop - 20% off this week", url: "https://example.com/shop", image: "", size: "l", enabled: true },
    { id: "b2", type: "link", title: "Book a call", subtitle: "", url: "https://example.com/book", image: "", size: "m", enabled: true },
    { id: "b3", type: "link", title: "Our blog", subtitle: "", url: "https://example.com/blog", image: "", size: "m", enabled: true },
    { id: "b4", type: "embed", title: "Watch our story", subtitle: "", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", image: "", size: "l", enabled: true },
    { id: "b5", type: "signup", title: "Join the list", subtitle: "Get drops and deals first.", url: "", image: "", size: "l", enabled: true },
  ],
};

export function embedSrc(url) {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, "");
    if (h === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (h === "youtube.com" || h === "m.youtube.com") {
      if (u.pathname.startsWith("/embed/")) return url;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (h === "open.spotify.com") return `https://open.spotify.com/embed${u.pathname}`;
    if (h === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.slice(1)}`;
  } catch {}
  return null;
}
