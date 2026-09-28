'use client';

import { useState } from 'react';
import { VIDEO_TYPES } from '@/lib/constants';
import VideoCard from './VideoCard';

export default function VideoTabs({ videos }) {
  const [active, setActive] = useState(VIDEO_TYPES[0].value);
  const filtered = videos.filter((v) => v.type === active);

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {VIDEO_TYPES.map((t) => {
          const count = videos.filter((v) => v.type === t.value).length;
          const isActive = active === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setActive(t.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                isActive ? 'bg-lavender text-ink shadow-sm' : 'bg-white/60 text-ink-soft hover:bg-white'
              }`}
            >
              {t.label} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-soft text-sm italic py-12 text-center">No videos here yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
