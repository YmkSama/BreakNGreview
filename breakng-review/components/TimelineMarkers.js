'use client';

import { useEffect, useState } from 'react';
import { classLabels } from '@/lib/constants';
import { formatTimestamp } from '@/lib/time';

// Strip under the player: one emoji per classified note, positioned by timestamp.
export default function TimelineMarkers({ notes, playerRef }) {
  const [duration, setDuration] = useState(0);

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

  const markers = notes.filter((n) => n.timestampSeconds != null && classLabels(n.classes).length > 0);
  if (!duration || markers.length === 0) return null;

  return (
    <div className="relative h-8 mt-2 bg-lavender-soft/60 rounded-full" aria-label="Note markers">
      {markers.map((n) => {
        const cls = classLabels(n.classes);
        const pct = Math.min(100, Math.max(0, (n.timestampSeconds / duration) * 100));
        return (
          <button
            key={n.id}
            onClick={() => {
              playerRef.current?.seekTo?.(n.timestampSeconds, true);
              playerRef.current?.playVideo?.();
            }}
            title={`${formatTimestamp(n.timestampSeconds)} · ${cls.map((c) => c.label).join(', ')}`}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-base leading-none hover:scale-125 transition"
            style={{ left: `${pct}%` }}
          >
            {cls[0].emoji}
            {cls.length > 1 && <span className="text-[9px] align-top font-semibold">+{cls.length - 1}</span>}
          </button>
        );
      })}
    </div>
  );
}
