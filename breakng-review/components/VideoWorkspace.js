'use client';

import { useRef } from 'react';
import Link from 'next/link';
import YouTubeEmbed from './YouTubeEmbed';
import NotesPanel from './NotesPanel';
import EditVideoControls from './EditVideoControls';
import TimelineMarkers from './TimelineMarkers';
import { videoTypeLabel } from '@/lib/constants';

export default function VideoWorkspace({ video, initialNotes, users, initialSeek }) {
  const playerRef = useRef(null);

  return (
    <div>
      <Link href="/videos" className="text-sm text-ink-soft hover:text-ink">← All videos</Link>
      <div className="flex items-start justify-between gap-4 mt-1 mb-4">
        <h1 className="font-display text-2xl">
          {video.episodeNumber ? `#${video.episodeNumber} — ` : ''}
          {video.title}
          <span className="ml-2 align-middle text-xs font-sans font-medium bg-lavender-soft text-ink-soft rounded-full px-2 py-1">
            {videoTypeLabel(video.type)}
          </span>
        </h1>
        <EditVideoControls video={video} />
      </div>
      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        <div>
          <YouTubeEmbed youtubeId={video.youtubeId} playerRef={playerRef} initialSeek={initialSeek} />
          <TimelineMarkers notes={initialNotes} playerRef={playerRef} />
        </div>
        <NotesPanel video={video} initialNotes={initialNotes} users={users} playerRef={playerRef} />
      </div>
    </div>
  );
}
