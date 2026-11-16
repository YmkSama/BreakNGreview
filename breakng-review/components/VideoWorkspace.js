'use client';

import { useRef } from 'react';
import Link from 'next/link';
import YouTubeEmbed from './YouTubeEmbed';
import NotesPanel from './NotesPanel';
import EditVideoControls from './EditVideoControls';
import TimelineMarkers from './TimelineMarkers';
import ImportMarkers from './ImportMarkers';
import { videoTypeLabel } from '@/lib/constants';

export default function VideoWorkspace({ video, initialNotes, users, initialSeek }) {
  const playerRef = useRef(null);

  return (
    <div>
      <Link href="/videos" className="text-sm text-ink-soft hover:text-ink">← All videos</Link>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-1 mb-4">
        <h1 className="font-display text-2xl text-balance">
          {video.episodeNumber ? `#${video.episodeNumber} — ` : ''}
          {video.title}
          <span className="ml-2 align-middle text-xs font-sans font-medium bg-lavender-soft text-ink-soft rounded-full px-2 py-1">
            {videoTypeLabel(video.type)}
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <ImportMarkers videoId={video.id} />
          <EditVideoControls video={video} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Pinned on phones so the video stays in view while you write a note */}
        <div className="sticky top-0 z-30 -mx-4 px-4 pb-2 bg-[#F8F5FB] shadow-[0_6px_10px_-8px_rgba(74,69,96,0.35)] lg:static lg:mx-0 lg:p-0 lg:bg-transparent lg:shadow-none">
          <YouTubeEmbed youtubeId={video.youtubeId} playerRef={playerRef} initialSeek={initialSeek} />
          <TimelineMarkers notes={initialNotes} playerRef={playerRef} />
        </div>
        <NotesPanel video={video} initialNotes={initialNotes} users={users} playerRef={playerRef} />
      </div>
    </div>
  );
}
