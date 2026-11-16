'use client';

import { useEffect, useState } from 'react';
import { classLabels } from '@/lib/constants';
import { formatTimestamp } from '@/lib/time';

// Strip under the player: a rule with a faint tick for every timed note (so you can see where the
// episode is dense), and the class emoji on top of the ticks that have one. Click to jump.
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

  const timed = notes.filter((n) => n.timestampSeconds != null);
  if (!duration || timed.length === 0) return null;

  const pct = (s) => `${Math.min(100, Math.max(0, (s / duration) * 100))}%`;
  const seek = (s) => {
    playerRef.current?.seekTo?.(s, true);
    playerRef.current?.playVideo?.();
  };

  return (
    <div className="mt-2" role="group" aria-label="Note timeline">
      <div className="relative h-11">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-lavender rounded-full" aria-hidden="true" />

        {timed.map((n) => (
          <span
            key={`t${n.id}`}
            className="absolute top-1/2 w-0.5 h-3 -translate-x-1/2 -translate-y-1/2 bg-ink-soft/60 rounded-full"
            style={{ left: pct(n.timestampSeconds) }}
            aria-hidden="true"
          />
        ))}

        {timed
          .filter((n) => classLabels(n.classes).length > 0)
          .map((n) => {
            const cls = classLabels(n.classes);
            return (
              <button
                key={n.id}
                onClick={() => seek(n.timestampSeconds)}
                title={`${formatTimestamp(n.timestampSeconds)} · ${cls.map((c) => c.label).join(', ')}`}
                aria-label={`Jump to ${formatTimestamp(n.timestampSeconds)}: ${cls.map((c) => c.label).join(', ')}`}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-[85%] min-w-8 min-h-8 flex items-center justify-center text-lg leading-none hover:scale-125 transition"
                style={{ left: pct(n.timestampSeconds) }}
              >
                <span aria-hidden="true">{cls[0].emoji}</span>
                {cls.length > 1 && (
                  <span className="absolute -right-0.5 -top-0.5 rounded-full bg-paper border border-lavender text-xs leading-none px-1 py-px font-semibold tabular">
                    {cls.length}
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
    </div>
  );
}
