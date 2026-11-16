'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import YouTubeEmbed from './YouTubeEmbed';
import NotesPanel from './NotesPanel';
import EditVideoControls from './EditVideoControls';
import TimelineMarkers from './TimelineMarkers';
import ImportMarkers from './ImportMarkers';
import ExportMarkers from './ExportMarkers';
import usePlayhead from './usePlayhead';
import { videoTypeLabel } from '@/lib/constants';

const DEPT_KEY = 'bnt:dept';

export default function VideoWorkspace({ video, initialNotes, users, initialSeek, currentUserId }) {
  const playerRef = useRef(null);
  const time = usePlayhead(playerRef);
  const [actionsOpen, setActionsOpen] = useState(false);

  // One department filter for the whole page: the chips above the list and the markers on the timeline.
  const [dept, setDept] = useState('ALL');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEPT_KEY);
      if (saved) setDept(saved);
    } catch (e) {}
  }, []);
  const changeDept = (v) => {
    setDept(v);
    try {
      localStorage.setItem(DEPT_KEY, v);
    } catch (e) {}
  };

  return (
    <div>
      <Link href="/videos" className="text-sm text-ink-soft hover:text-ink">← All videos</Link>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-1 mb-4">
        <h1 className="font-display text-2xl text-balance">
          {video.episodeNumber ? `#${video.episodeNumber}: ` : ''}
          {video.title}
          <span className="ml-2 align-middle text-xs font-sans font-medium bg-lavender-soft text-ink-soft rounded-full px-2 py-1">
            {videoTypeLabel(video.type)}
          </span>
        </h1>

        {/* Phones tuck the video actions behind one button; wider screens show them inline. */}
        <button
          onClick={() => setActionsOpen((o) => !o)}
          aria-expanded={actionsOpen}
          className="sm:hidden self-start px-3 py-1.5 rounded-lg bg-lavender-soft text-ink-soft text-sm"
        >
          {actionsOpen ? 'Hide video actions' : 'Video actions'}
        </button>
        <div className={`${actionsOpen ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-2 sm:shrink-0`}>
          <ImportMarkers videoId={video.id} />
          <ExportMarkers video={video} notes={initialNotes} playerRef={playerRef} currentUserId={currentUserId} />
          <EditVideoControls video={video} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Pinned on phones so the video stays in view while you write a note, and on wide screens so it stays beside the list */}
        <div className="sticky top-0 z-30 -mx-4 px-4 pb-2 bg-[#F8F5FB] shadow-[0_6px_10px_-8px_rgba(74,69,96,0.35)] lg:top-20 lg:mx-0 lg:p-0 lg:bg-transparent lg:shadow-none">
          <YouTubeEmbed youtubeId={video.youtubeId} playerRef={playerRef} initialSeek={initialSeek} />
          <TimelineMarkers notes={initialNotes} playerRef={playerRef} time={time} dept={dept} />
        </div>
        <NotesPanel
          video={video}
          initialNotes={initialNotes}
          users={users}
          playerRef={playerRef}
          time={time}
          currentUserId={currentUserId}
          dept={dept}
          onDeptChange={changeDept}
        />
      </div>
    </div>
  );
}
