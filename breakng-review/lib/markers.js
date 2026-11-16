// Parses marker exports (e.g. Premiere Pro "Export Markers as CSV") into note drafts.

const MAX_ROWS = 500;

// Minimal RFC 4180 parser: quoted fields, escaped quotes, newlines inside quotes.
function parseCsv(text) {
  const src = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// Best-effort class guesses from marker wording; the user can adjust before importing.
const CLASS_RULES = [
  ['SFX', /sfx|sound|rumble|roar|clang|whoosh|voice|\bfx\b|echo|music|theme/i],
  ['MOTION_GRAPHICS', /mo\s?-?gra|mograph|motion graphic|graphic|artwork/i],
  ['VFX', /vfx|warp|power.?up|visual effect/i],
  ['CUT', /\bcut\b|cut out|trim/i],
  ['TRANSITION', /transition|dissolve|wipe/i],
  ['CAMERA_MOVE', /camera|push.?in|pull.?out|zoom|\bpan\b/i],
  ['SOCIAL_CLIP', /social|reel|tiktok|short clip|\bclip\b/i],
];

function guessClasses(...parts) {
  const s = parts.filter(Boolean).join(' ');
  return CLASS_RULES.filter(([, re]) => re.test(s)).map(([value]) => value);
}

function findColumn(header, ...names) {
  const norm = header.map((h) => h.trim().toLowerCase());
  for (const n of names) {
    const i = norm.indexOf(n);
    if (i !== -1) return i;
  }
  return -1;
}

// Returns { rows } or { error }. Each row: { id, seconds, endSeconds, name, comment, color, classes, skip }
function parseMarkers(csvText) {
  const table = parseCsv(csvText);
  if (table.length < 2) return { error: 'That file has no marker rows.' };

  const header = table[0];
  const inCol = findColumn(header, 'seconds in', 'in seconds');
  const outCol = findColumn(header, 'seconds out', 'out seconds');
  const nameCol = findColumn(header, 'name', 'marker name');
  const commentCol = findColumn(header, 'comment', 'comments', 'description', 'notes');
  const colorCol = findColumn(header, 'color', 'colour');
  if (inCol === -1 || nameCol === -1) {
    return { error: 'Could not find "Seconds In" and "Name" columns. Export the markers as CSV including seconds.' };
  }

  const rows = [];
  for (let i = 1; i < table.length && rows.length < MAX_ROWS; i++) {
    const r = table[i];
    const seconds = parseFloat(r[inCol]);
    if (!Number.isFinite(seconds) || seconds < 0) continue;
    const outRaw = outCol !== -1 ? parseFloat(r[outCol]) : NaN;
    const endSeconds = Number.isFinite(outRaw) && outRaw > seconds ? outRaw : null;
    const name = (r[nameCol] || '').trim();
    const comment = commentCol !== -1 ? (r[commentCol] || '').trim() : '';
    if (!name && !comment) continue;
    rows.push({
      id: i,
      seconds,
      endSeconds,
      name,
      comment,
      color: colorCol !== -1 ? (r[colorCol] || '').trim() : '',
      classes: guessClasses(name, comment),
      // Sync-point markers added by audio-sync tools carry no review content.
      skip: /^pluraleyes/i.test(name),
    });
  }
  if (rows.length === 0) return { error: 'No usable markers were found in that file.' };
  return { rows, truncated: table.length - 1 > MAX_ROWS };
}

// Note text: marker name, with the marker comment on a second line.
function markerNoteText({ name, comment }) {
  return [name, comment].filter(Boolean).join('\n');
}

module.exports = { MAX_ROWS, parseCsv, parseMarkers, guessClasses, markerNoteText };
