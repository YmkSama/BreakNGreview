'use client';

import { useEffect, useState } from 'react';

// Current video time in seconds, polled from the YouTube player. Only updates state when the
// time moves by at least half a second, so a paused video causes no re-renders.
export default function usePlayhead(playerRef) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.();
      if (typeof t === 'number') setTime((prev) => (Math.abs(prev - t) >= 0.5 ? t : prev));
    }, 500);
    return () => clearInterval(id);
  }, [playerRef]);

  return time;
}
