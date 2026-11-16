'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { importMarkersAction } from '@/app/videos/[id]/actions';
import { parseMarkers, markerNoteText } from '@/lib/markers';
import { formatTimestamp } from '@/lib/time';
import ClassPicker from './ClassPicker';

export default function ImportMarkers({ videoId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [offset, setOffset] = useState('0');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setFileName('');
    setRows([]);
    setSelected(new Set());
    setOffset('0');
    setError(null);
    setResult(null);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    reset();
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    setFileName(file.name);
    const parsed = parseMarkers(await file.text());
    if (parsed.error) return setError(parsed.error);
    setRows(parsed.rows);
    setSelected(new Set(parsed.rows.filter((r) => !r.skip).map((r) => r.id)));
    if (parsed.truncated) setError('Only the first 500 markers were read.');
  }

  const toggleRow = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setRowClasses = (id, classes) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, classes } : r)));

  const offsetNum = parseFloat(offset) || 0;
  const chosen = rows.filter((r) => selected.has(r.id));

  function submit() {
    setError(null);
    const items = chosen
      .map((r) => ({
        text: markerNoteText(r),
        timestampSeconds: r.seconds + offsetNum,
        endTimestampSeconds: r.endSeconds != null ? r.endSeconds + offsetNum : null,
        classes: r.classes,
      }))
      .filter((i) => i.timestampSeconds >= 0);
    if (items.length === 0) return setError('Select at least one marker with a valid time.');

    startTransition(async () => {
      const res = await importMarkersAction(videoId, items);
      if (res?.error) return setError(res.error);
      setResult(res);
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-1.5 rounded-lg bg-sky-soft text-ink-soft hover:text-ink text-sm">
        Import markers
      </button>

      {open && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm flex items-start justify-center p-4 pt-16 z-50" onClick={close}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-paper rounded-3xl shadow-lg p-6 w-full max-w-3xl max-h-[85vh] flex flex-col gap-3 border border-lavender-soft"
          >
            <h2 className="font-display text-xl">Import markers from a CSV</h2>

            {result ? (
              <>
                <p className="text-sm bg-mint/40 rounded-lg px-3 py-2">
                  Imported {result.created} note{result.created === 1 ? '' : 's'}
                  {result.skipped > 0 && ` (${result.skipped} already on this video, skipped)`}.
                </p>
                <div className="flex justify-end">
                  <button onClick={close} className="px-4 py-2 rounded-xl bg-mint text-ink font-semibold text-sm">Done</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-soft">
                  Upload a marker export (for example Premiere Pro&apos;s <em>Export Markers → CSV</em>). Each marker
                  becomes a timestamped note; markers with a duration become ranges. You&apos;re listed as the author.
                </p>

                <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />

                {error && <p className="text-sm text-ink bg-rose-soft rounded-lg px-3 py-2">{error}</p>}

                {rows.length > 0 && (
                  <>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        Time offset (seconds)
                        <input
                          type="number"
                          step="any"
                          value={offset}
                          onChange={(e) => setOffset(e.target.value)}
                          className="w-24 rounded-lg border border-lavender-soft px-2 py-1"
                        />
                      </label>
                      <span className="text-xs text-ink-soft">
                        Use a negative number if your timeline starts later than the YouTube video (e.g. -3600 for a 01:00:00:00 start).
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-ink-soft">
                      <span>{fileName}: {chosen.length} of {rows.length} selected</span>
                      <button onClick={() => setSelected(new Set(rows.map((r) => r.id)))} className="underline">All</button>
                      <button onClick={() => setSelected(new Set())} className="underline">None</button>
                    </div>

                    <div className="overflow-y-auto space-y-2 pr-1 min-h-0">
                      {rows.map((r) => (
                        <div key={r.id} className={`rounded-xl border border-lavender-soft p-3 bg-white/70 ${selected.has(r.id) ? '' : 'opacity-50'}`}>
                          <label className="flex items-start gap-2 text-sm">
                            <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} className="mt-1" />
                            <span className="font-mono text-xs bg-sky-soft rounded-full px-2 py-0.5 shrink-0">
                              {formatTimestamp(r.seconds + offsetNum)}
                              {r.endSeconds != null && `–${formatTimestamp(r.endSeconds + offsetNum)}`}
                            </span>
                            <span className="whitespace-pre-wrap">{markerNoteText(r)}</span>
                          </label>
                          <div className="mt-2 ml-6">
                            <ClassPicker value={r.classes} onChange={(c) => setRowClasses(r.id, c)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={close} className="px-4 py-2 rounded-xl text-sm text-ink-soft">Cancel</button>
                  <button
                    onClick={submit}
                    disabled={pending || chosen.length === 0}
                    className="px-4 py-2 rounded-xl bg-mint text-ink font-semibold text-sm disabled:opacity-50"
                  >
                    {pending ? 'Importing…' : `Import ${chosen.length || ''} note${chosen.length === 1 ? '' : 's'}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
