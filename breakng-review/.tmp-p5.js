const fs = require('fs');
function edit(p, pairs) {
  let s = fs.readFileSync(p, 'utf8');
  const crlf = s.includes('\r\n');
  s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) { console.error('MISSING in', p, ':', a.slice(0, 80)); process.exit(1); }
    s = s.replace(a, () => b);
  }
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, s);
}
edit('components/ExportMarkers.js', [
  ["  const title = `${video.episodeNumber ? `Ep ${video.episodeNumber} ` : ''}${video.title}`.trim();",
   "  // Add the episode number only when the title doesn't already say it.\n  const hasEpisode = video.episodeNumber && new RegExp(`\\\\b(ep|episode|#)\\\\s*0*${video.episodeNumber}\\\\b`, 'i').test(video.title);\n  const title = `${video.episodeNumber && !hasEpisode ? `Ep ${video.episodeNumber} ` : ''}${video.title}`.trim();"],
]);
edit('components/TimelineMarkers.js', [
  ['                <span aria-hidden="true">{c.emoji}</span> {c.count}',
   '                {c.emoji ? (\n                  <span aria-hidden="true">{c.emoji}</span>\n                ) : (\n                  <span aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-full bg-ink-soft/80 align-middle" />\n                )}{\' \'}\n                {c.count}'],
]);
console.log('ok');
