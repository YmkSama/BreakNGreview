// Builds marker files for Adobe Premiere Pro from review notes.
//  - Premiere XML: FCP7-style "xmeml" with the notes as sequence markers. Premiere imports it
//    (File > Import) as a new sequence carrying the markers.
//  - Marker CSV: the same columns as the marker sheets this app imports, so it round-trips.

const FRAME_RATES = [
  { value: '23.976', label: '23.976 fps', timebase: 24, ntsc: true, fps: 24000 / 1001 },
  { value: '24', label: '24 fps', timebase: 24, ntsc: false, fps: 24 },
  { value: '25', label: '25 fps', timebase: 25, ntsc: false, fps: 25 },
  { value: '29.97', label: '29.97 fps', timebase: 30, ntsc: true, fps: 30000 / 1001 },
  { value: '30', label: '30 fps', timebase: 30, ntsc: false, fps: 30 },
];
const DEFAULT_FPS = '25';

// Premiere marker colours by department; notes without one are white.
const DEPARTMENT_COLORS = {
  SFX: 'Blue',
  MOTION_GRAPHICS: 'Yellow',
  VFX: 'Cyan',
  CUT: 'Green',
  TRANSITION: 'Orange',
  CAMERA_MOVE: 'Purple',
  SOCIAL_CLIP: 'Red',
};

const STATUS_LABEL = { OPEN: 'Open', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved' };

function rateInfo(value) {
  return FRAME_RATES.find((r) => r.value === String(value)) || FRAME_RATES.find((r) => r.value === DEFAULT_FPS);
}

function pad(n, w = 2) {
  return String(n).padStart(w, '0');
}

// Non-drop timecode HH:MM:SS:FF for a frame count.
function frameTimecode(frames, rate) {
  const tb = rate.timebase;
  const f = frames % tb;
  const totalSeconds = Math.floor(frames / tb);
  return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}:${pad(f)}`;
}

function xmlEscape(s) {
  return String(s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// First line becomes the marker name; everything else goes in the comment.
function splitText(text) {
  const lines = String(text || '').split(/\r?\n/);
  let name = (lines.shift() || '').trim();
  let rest = lines.join('\n').trim();
  if (name.length > 80) {
    rest = `${name.slice(80)}${rest ? `\n${rest}` : ''}`.trim();
    name = name.slice(0, 80).trim();
  }
  return { name: name || 'Note', rest };
}

// Everything a reviewer would want next to the marker, never blank (empty comments upset some importers).
function buildComment(note, classLabels) {
  const { rest } = splitText(note.text);
  const meta = [
    note.author?.name ? `by ${note.author.name}` : null,
    classLabels.length ? classLabels.map((c) => c.label).join(', ') : null,
    STATUS_LABEL[note.status] || null,
    note.assignee?.name ? `assigned to ${note.assignee.name}` : null,
  ].filter(Boolean);
  const replies = (note.replies || []).map((r) => `Reply, ${r.author?.name || 'Unknown'}: ${String(r.text).replace(/\s+/g, ' ')}`);
  return [rest, meta.join(' | '), ...replies].filter(Boolean).join('\n');
}

// Notes to markers: top-level notes with a time, in time order, shifted by `offsetSeconds`.
function toMarkers(notes, { fps, offsetSeconds = 0 }, classInfo) {
  const rate = rateInfo(fps);
  return notes
    .filter((n) => n.timestampSeconds != null && !n.parentId)
    .map((n) => {
      const start = Math.max(0, n.timestampSeconds + offsetSeconds);
      const end = n.endTimestampSeconds != null ? Math.max(start, n.endTimestampSeconds + offsetSeconds) : null;
      const inFrame = Math.round(start * rate.fps);
      const outFrame = end != null ? Math.max(inFrame + 1, Math.round(end * rate.fps)) : null;
      const classes = classInfo(n.classes || []);
      return {
        note: n,
        classes,
        startSeconds: start,
        endSeconds: end,
        inFrame,
        outFrame,
        name: splitText(n.text).name,
        comment: buildComment(n, classes),
        color: DEPARTMENT_COLORS[(n.classes || [])[0]] || 'White',
      };
    })
    .sort((a, b) => a.inFrame - b.inFrame);
}

function buildPremiereXml({ title, markers, fps, durationSeconds }) {
  const rate = rateInfo(fps);
  const lastFrame = markers.reduce((m, x) => Math.max(m, x.outFrame ?? x.inFrame), 0);
  const durationFrames = Math.max(Math.round((durationSeconds || 0) * rate.fps), lastFrame + Math.round(10 * rate.fps), 1);
  const rateXml = `<rate><timebase>${rate.timebase}</timebase><ntsc>${rate.ntsc ? 'TRUE' : 'FALSE'}</ntsc></rate>`;

  const markerXml = markers
    .map(
      (m) => `      <marker>
        <comment>${xmlEscape(m.comment || 'No details')}</comment>
        <name>${xmlEscape(m.name)}</name>
        <in>${m.inFrame}</in>
        <out>${m.outFrame ?? -1}</out>
      </marker>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence id="breakng-markers">
    <name>${xmlEscape(title)}</name>
    <duration>${durationFrames}</duration>
    ${rateXml}
    <timecode>
      ${rateXml}
      <string>00:00:00:00</string>
      <frame>0</frame>
      <displayformat>NDF</displayformat>
    </timecode>
${markerXml}
    <media>
      <video>
        <format>
          <samplecharacteristics>
            ${rateXml}
            <width>1920</width>
            <height>1080</height>
            <anamorphic>FALSE</anamorphic>
            <pixelaspectratio>square</pixelaspectratio>
            <fielddominance>none</fielddominance>
          </samplecharacteristics>
        </format>
        <track></track>
      </video>
      <audio>
        <numOutputChannels>2</numOutputChannels>
        <format>
          <samplecharacteristics>
            <depth>16</depth>
            <samplerate>48000</samplerate>
          </samplecharacteristics>
        </format>
        <track></track>
      </audio>
    </media>
  </sequence>
</xmeml>
`;
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Marker template: Seconds In, Seconds Out (blank for a single point), Name, Comment, Color.
// Times are plain seconds (no frame rounding), so no frame rate is needed.
function secondsCell(n) {
  return String(Math.round(n * 1000) / 1000);
}

function buildMarkerCsv({ markers }) {
  const header = ['Seconds In', 'Seconds Out', 'Name', 'Comment', 'Color'];
  const rows = markers.map((m) => [
    secondsCell(m.startSeconds),
    m.endSeconds != null ? secondsCell(m.endSeconds) : '',
    m.name,
    m.comment,
    m.color,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

module.exports = { FRAME_RATES, DEFAULT_FPS, DEPARTMENT_COLORS, toMarkers, buildPremiereXml, buildMarkerCsv };
