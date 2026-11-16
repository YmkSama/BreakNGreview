'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { NOTE_CLASSES, classLabels } from '@/lib/constants';
import { formatTimestamp } from '@/lib/time';

const MARKER_PX = 30; // markers closer than this merge into one cluster

// Strip under the player: a rule with a faint tick for every timed note, class emoji on top
// (merged into counted clusters where they would overlap), a "now" line for the playhead, and a
// legend whose chips switch departments on and off.
export default function TimelineMarkers({ notes, playerRef, time = 0 }) {
  const [duration, setDuration] = useState(0);
  const [width, setWidth] = useState(0);
  const [hidden, setHidden] = useState(() => new Set());
  const trackRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      const d = playerRef.current?.getDuration?.();
      if (d > 0) {
        setDuration(d);
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
  }, [playerRef]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [duration]);

  const timed = useMemo(() => notes.filter((n) => n.timestampSeconds != null), [notes]);

  // Departments actually used in this video, with counts, for the legend.
  const legend = useMemo(() => {
    const counts = {};
    for (const n of timed) for (const c of n.classes || []) counts[c] = (counts[c] || 0) + 1;
    return NOTE_CLASSES.filter((c) => counts[c.value]).map((c) => ({ ...c, count: counts[c.value] }));
  }, [timed]);

  const clusters = useMemo(() => {
    if (!duration || !width) return [];
    const visible = timed
      .map((n) => ({ n, cls: classLabels(n.classes).filter((c) => !hidden.has(c.value)) }))
      .filter((x) => x.cls.length > 0)
      .sort((a, b) => a.n.timestampSeconds - b.n.timestampSeconds);
    const out = [];
    for (const x of visible) {
      const px = (x.n.timestampSeconds / duration) * width;
      const last = out[out.length - 1];
      if (last && px - last.startPx < MARKER_PX) last.items.push(x);
      else out.push({ startPx: px, items: [x] });
    }
    return out;
  }, [timed, hidden, duration, width]);

  if (!duration || timed.length === 0) return null;

  const pct = (s) => `${Math.min(100, Math.max(0, (s / duration) * 100))}%`;
  const seek = (s) => {
    playerRef.current?.seekTo?.(s, true);
    playerRef.current?.playVideo?.();
  };
  const toggleClass = (v) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  return (
    <div className="mt-2" role="group" aria-label="Note timeline">
      <div ref={trackRef} className="relative h-11">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-lavender rounded-full" aria-hidden="true" />

        {timed.map((n) => (
          <span
            key={`t${n.id}`}
            className="absolute top-1/2 w-0.5 h-3 -translate-x-1/2 -translate-y-1/2 bg-ink-soft/60 rounded-full"
            style={{ left: pct(n.timestampSeconds) }}
            aria-hidden="true"
          />
        ))}

        {/* playhead */}
        <span
          className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-[#6D63B0] rounded-full pointer-events-none"
          style={{ left: pct(time) }}
          aria-hidden="true"
        />

        {clusters.map((c) => {
          const first = c.items[0];
          const size = c.items.length;
          const label =
            size === 1
              ? `${formatTimestamp(first.n.timestampSeconds)} · ${first.cls.map((x) => x.label).join(', ')}`
              : `${size} notes from ${formatTimestamp(first.n.timestampSeconds)}`;
          return (
            <button
              key={first.n.id}
              onClick={() => seek(first.n.timestampSeconds)}
              title={label}
              aria-label={`Jump to ${label}`}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-[85%] min-w-8 min-h-8 flex items-center justify-center text-lg leading-none hover:scale-125 transition"
              style={{ left: pct(first.n.timestampSeconds) }}
            >
              <span aria-hidden="true">{first.cls[0].emoji}</span>
              {size > 1 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-paper border border-lavender text-xs leading-none px-1 py-px font-semibold tabular">
                  {size}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-ink-soft tabular font-mono" aria-hidden="true">
        <span>0:00</span>
        <span>{formatTimestamp(duration)}</span>
      </div>

      {legend.length > 0 && (
        <div className="hidden sm:flex gap-1.5 overflow-x-auto pb-1 mt-1" role="group" aria-label="Show departments on the timeline">
          {legend.map((c) => {
            const on = !hidden.has(c.value);
            return (
              <button
                key={c.value}
                onClick={() => toggleClass(c.value)}
                aria-pressed={on}
                title={`${c.label}: ${on ? 'shown' : 'hidden'} on the timeline`}
                className={`shrink-0 rounded-full border px-2 py-0.5 text-xs tabular ${on ? 'bg-white border-lavender text-ink' : 'bg-transparent border-lavender-soft text-ink-soft line-through'}`}
              >
                <span aria-hidden="true">{c.emoji}</span> {c.count}
                <span className="sr-only"> {c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
