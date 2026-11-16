'use client';

import { useMemo, useState } from 'react';
import { classLabels } from '@/lib/constants';
import { FRAME_RATES, DEFAULT_FPS, toMarkers, buildPremiereXml, buildMarkerCsv } from '@/lib/exportMarkers';
import { formatTimestamp } from '@/lib/time';

const SCOPES = [
  { value: 'ALL', label: 'All notes with a time' },
  { value: 'TODO', label: 'To do only (not resolved)' },
  { value: 'MINE', label: 'Assigned to me' },
];

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportMarkers({ video, notes, playerRef, currentUserId }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('XML');
  const [scope, setScope] = useState('ALL');
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [offset, setOffset] = useState('0');

  const offsetNum = parseFloat(offset) || 0;
  // Add the episode number only when the title doesn't already say it.
  const hasEpisode = video.episodeNumber && new RegExp(`\\b(ep|episode|#)\\s*0*${video.episodeNumber}\\b`, 'i').test(video.title);
  const title = `${video.episodeNumber && !hasEpisode ? `Ep ${video.episodeNumber} ` : ''}${video.title}`.trim();

  const markers = useMemo(() => {
    const chosen = notes.filter(
      (n) =>
        n.timestampSeconds != null &&
        (scope === 'ALL' || (scope === 'TODO' ? n.status !== 'RESOLVED' : n.assigneeId === currentUserId))
    );
    return toMarkers(chosen, { fps, offsetSeconds: offsetNum }, classLabels);
  }, [notes, scope, fps, offsetNum, currentUserId]);

  const withoutTime = notes.filter((n) => n.timestampSeconds == null).length;

  function onDownload() {
    const base = `${title.replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'markers'}-markers`;
    if (format === 'XML') {
      const duration = playerRef?.current?.getDuration?.() || 0;
      download(`${base}.xml`, buildPremiereXml({ title: `${title} (review markers)`, markers, fps, durationSeconds: duration + offsetNum }), 'application/xml');
    } else {
      download(`${base}.csv`, buildMarkerCsv({ markers }), 'text/csv');
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-1.5 rounded-lg bg-mint-soft text-ink-soft hover:text-ink text-sm">
        Export markers
      </button>

      {open && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm flex items-start justify-center p-4 pt-16 z-50" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-paper rounded-3xl shadow-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto flex flex-col gap-4 border border-lavender-soft"
          >
            <h2 className="font-display text-xl">Export markers for Premiere Pro</h2>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium mb-1">File type</legend>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="fmt" checked={format === 'XML'} onChange={() => setFormat('XML')} className="mt-1" />
                <span>
                  <strong>Premiere XML (.xml)</strong>
                  <span className="block text-xs text-ink-soft">
                    Import it in Premiere (File → Import). You get a sequence that carries every note as a marker, with
                    the note text as the marker name and comment.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="fmt" checked={format === 'CSV'} onChange={() => setFormat('CSV')} className="mt-1" />
                <span>
                  <strong>Marker template (.csv)</strong>
                  <span className="block text-xs text-ink-soft">
                    Columns: Seconds In, Seconds Out, Name, Comment, Color. Marker colors follow the department. Re-importable
                    here.
                  </span>
                </span>
              </label>
            </fieldset>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="block">
                Notes to include
                <select value={scope} onChange={(e) => setScope(e.target.value)} className="mt-1 w-full rounded-lg border border-lavender-soft px-2 py-1.5 bg-white">
                  {SCOPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
              {format === 'XML' && (
                <label className="block">
                  Sequence frame rate
                  <select value={fps} onChange={(e) => setFps(e.target.value)} className="mt-1 w-full rounded-lg border border-lavender-soft px-2 py-1.5 bg-white">
                    {FRAME_RATES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block col-span-2">
                Time offset (seconds)
                <input
                  type="number"
                  step="any"
                  value={offset}
                  onChange={(e) => setOffset(e.target.value)}
                  className="mt-1 w-32 rounded-lg border border-lavender-soft px-2 py-1.5 bg-white block"
                />
                <span className="text-xs text-ink-soft">
                  Added to every time. Use 3600 if your Premiere timeline starts at 01:00:00:00.
                </span>
              </label>
            </div>

            <p className="text-sm rounded-lg bg-lavender-soft/60 px-3 py-2 tabular">
              {markers.length} marker{markers.length === 1 ? '' : 's'}
              {markers.length > 0 && ` from ${formatTimestamp(markers[0].startSeconds)} to ${formatTimestamp(markers[markers.length - 1].endSeconds ?? markers[markers.length - 1].startSeconds)}`}
              {withoutTime > 0 && <span className="text-ink-soft block text-xs">{withoutTime} note{withoutTime === 1 ? ' has' : 's have'} no time and will be left out.</span>}
            </p>

            {format === 'XML' && (
              <p className="text-xs text-ink-soft">
                The frame rate must match your Premiere sequence, or the markers will land off by a few frames. Premiere
                imports this as a new sequence. To move the markers onto your edit, copy them across with Premiere&apos;s
                copy/paste setting for sequence markers. Premiere XML doesn&apos;t carry marker colors; use the .csv for those.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-ink-soft">Close</button>
              <button
                onClick={onDownload}
                disabled={markers.length === 0}
                className="px-4 py-2 rounded-xl bg-[#6D63B0] text-white font-semibold text-sm disabled:opacity-50"
              >
                Download {format === 'XML' ? '.xml' : '.csv'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
