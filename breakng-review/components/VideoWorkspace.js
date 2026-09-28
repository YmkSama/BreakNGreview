'use client';

import { useRef } from 'react';
import Link from 'next/link';
import YouTubeEmbed from './YouTubeEmbed';
import NotesPanel from './NotesPanel';
import { videoTypeLabel } from '@/lib/constants';

export default function VideoWorkspace({ video, initialNotes, users, initialSeek }) {
  const playerRef = useRef(null);

  return (
    <div>
      <Link href="/videos" className="text-sm text-ink-soft hover:text-ink">← All videos</Link>
      <h1 className="font-display text-2xl mt-1 mb-4">
        {video.episodeNumber ? `#${video.episodeNumber} — ` : ''}
        {video.title}
        <span className="ml-2 align-middle text-xs font-sans font-medium bg-lavender-soft text-ink-soft rounded-full px-2 py-1">
          {videoTypeLabel(video.type)}
        </span>
      </h1>
      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        <YouTubeEmbed youtubeId={video.youtubeId} playerRef={playerRef} initialSeek={initialSeek} />
        <NotesPanel video={video} initialNotes={initialNotes} users={users} playerRef={playerRef} />
      </div>
    </div>
  );
}
