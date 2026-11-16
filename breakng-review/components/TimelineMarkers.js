'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { classLabels } from '@/lib/constants';
import { formatTimestamp } from '@/lib/time';

const MARKER_PX = 30; // markers closer than this merge into one cluster
const NO_DEPT = { value: 'NONE', label: 'No department', emoji: null };

// Strip under the player: a rule with a tick for every timed note, department emoji on top
// (merged into counted clusters where they would overlap), and a "now" line for the playhead.
// `dept` is the page's single department filter (the chips above the notes list).
export default function TimelineMarkers({ notes, playerRef, time = 0, dept = 'ALL' }) {
  const [duration, setDuration] = useState(0);
  const [width, setWidth] = useState(0);
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

  // Timed notes that match the department filter, each with the department(s) to show.
  const shown = useMemo(() => {
    const out = [];
    for (const n of notes) {
      if (n.timestampSeconds == null) continue;
      const real = classLabels(n.classes);
      if (dept === 'ALL') out.push({ n, cls: real.length ? real : [NO_DEPT] });
      else if (dept === 'NONE') {
        if (real.length === 0) out.push({ n, cls: [NO_DEPT] });
      } else {
        const mine = real.filter((c) => c.value === dept);
        if (mine.length) out.push({ n, cls: mine });
      }
    }
    return out.sort((a, b) => a.n.timestampSeconds - b.n.timestampSeconds);
  }, [notes, dept]);

  const clusters = useMemo(() => {
    if (!duration || !width) return [];
    const out = [];
    for (const x of shown) {
      const px = (x.n.timestampSeconds / duration) * width;
      const last = out[out.length - 1];
      if (last && px - last.startPx < MARKER_PX) last.items.push(x);
      else out.push({ startPx: px, items: [x] });
    }
    return out;
  }, [shown, duration, width]);

  if (!duration || notes.every((n) => n.timestampSeconds == null)) return null;

  const pct = (s) => `${Math.min(100, Math.max(0, (s / duration) * 100))}%`;
  const seek = (s) => {
    playerRef.current?.seekTo?.(s, true);
    playerRef.current?.playVideo?.();
  };

  return (
    <div className="mt-3" role="group" aria-label="Note timeline">
      <div ref={trackRef} className="relative h-9 sm:h-11">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-lavender rounded-full" aria-hidden="true" />

        {shown.map(({ n }) => (
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
          const face = (c.items.find((x) => x.cls[0].emoji) || first).cls[0];
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
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 sm:-translate-y-[70%] min-w-8 min-h-8 flex items-center justify-center text-lg leading-none hover:scale-125 transition"
              style={{ left: pct(first.n.timestampSeconds) }}
            >
              {face.emoji ? (
                <span aria-hidden="true">{face.emoji}</span>
              ) : (
                <span aria-hidden="true" className="w-3 h-3 rounded-full bg-ink-soft/80 border-2 border-paper" />
              )}
              {size > 1 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-paper border border-lavender text-xs leading-none px-1 py-px font-semibold tabular">
                  {size}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden sm:flex justify-between text-xs text-ink-soft tabular font-mono" aria-hidden="true">
        <span>0:00</span>
        <span>{formatTimestamp(duration)}</span>
      </div>
    </div>
  );
}
