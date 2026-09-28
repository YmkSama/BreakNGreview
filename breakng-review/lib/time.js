function formatTimestamp(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '';
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatRange(start, end) {
  if (end === null || end === undefined) return formatTimestamp(start);
  return `${formatTimestamp(start)}–${formatTimestamp(end)}`;
}

// Accepts a full YouTube URL (watch, youtu.be, embed, shorts) or a bare 11-char ID.
function parseYoutubeId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

// Parses "mm:ss", "h:mm:ss", or a bare number of seconds into a float.
function parseTimeInput(str) {
  if (str === null || str === undefined) return null;
  const trimmed = String(str).trim();
  if (trimmed === '') return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed);
  const parts = trimmed.split(':').map((p) => parseFloat(p));
  if (parts.some((p) => Number.isNaN(p))) return null;
  let seconds = 0;
  for (const p of parts) seconds = seconds * 60 + p;
  return seconds;
}

module.exports = { formatTimestamp, formatRange, parseYoutubeId, parseTimeInput };
