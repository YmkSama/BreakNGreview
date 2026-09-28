'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleReactionAction, updateNoteFieldAction } from '@/app/videos/[id]/actions';
import { NOTE_TAGS, NOTE_STATUSES, tagInfo, statusInfo } from '@/lib/constants';
import { formatRange } from '@/lib/time';
import { splitMentionSegments } from '@/lib/mentions';
import NoteComposer from './NoteComposer';

export default function NoteItem({ note, users, playerRef, videoId, depth = 0 }) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const tInfo = tagInfo(note.tag);
  const sInfo = statusInfo(note.status);

  const jump = () => {
    if (note.timestampSeconds == null) return;
    playerRef.current?.seekTo?.(note.timestampSeconds, true);
    playerRef.current?.playVideo?.();
  };

  const react = async () => {
    await toggleReactionAction(note.id, videoId);
    router.refresh();
  };

  const changeField = async (field, value) => {
    await updateNoteFieldAction(note.id, videoId, field, value);
    router.refresh();
  };

  const segments = splitMentionSegments(note.text, users);

  return (
    <div className={depth > 0 ? 'ml-5 pl-3 border-l-2 border-lavender-soft mt-3' : 'bg-white/70 rounded-2xl p-4 border border-lavender-soft'}>
      <div className="flex items-center gap-2 flex-wrap text-xs mb-1.5">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ background: note.author?.color || '#eee' }}
        >
          {note.author?.name?.[0]?.toUpperCase() || '?'}
        </span>
        <span className="font-medium">{note.author?.name || 'Unknown'}</span>

        {note.timestampSeconds != null && (
          <button onClick={jump} className="px-2 py-0.5 rounded-full bg-sky-soft font-mono font-medium hover:brightness-95">
            {formatRange(note.timestampSeconds, note.endTimestampSeconds)}
          </button>
        )}

        {depth === 0 && (
          <>
            <select
              value={note.tag}
              onChange={(e) => changeField('tag', e.target.value)}
              className="rounded-full px-2 py-0.5 text-xs font-medium border-0"
              style={{ background: tInfo.color, color: tInfo.text }}
            >
              {NOTE_TAGS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={note.status}
              onChange={(e) => changeField('status', e.target.value)}
              className="rounded-full px-2 py-0.5 text-xs font-medium border-0"
              style={{ background: sInfo.color, color: sInfo.text }}
            >
              {NOTE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={note.assigneeId || ''}
              onChange={(e) => changeField('assigneeId', e.target.value ? parseInt(e.target.value, 10) : null)}
              className="rounded-full px-2 py-0.5 text-xs font-medium bg-white border border-lavender-soft"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </>
        )}
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {segments.map((seg, i) =>
          seg.type === 'mention' ? (
            <span key={i} className="bg-lavender-soft text-ink font-medium rounded px-1">{seg.value}</span>
          ) : (
            <span key={i}>{seg.value}</span>
          )
        )}
      </p>

      <div className="flex items-center gap-3 mt-2 text-xs text-ink-soft">
        <button onClick={react} className={`px-2 py-0.5 rounded-full ${note.reactedByMe ? 'bg-butter text-ink' : 'bg-ink/5'}`}>
          👍 {note.reactionCount || ''}
        </button>
        <button onClick={() => setReplying((r) => !r)} className="hover:text-ink">
          Reply{note.replies?.length > 0 ? ` (${note.replies.length})` : ''}
        </button>
      </div>

      {replying && (
        <NoteComposer
          videoId={videoId}
          users={users}
          playerRef={playerRef}
          parentId={note.id}
          compact
          onDone={() => setReplying(false)}
        />
      )}

      {note.replies?.map((r) => (
        <NoteItem key={r.id} note={r} users={users} playerRef={playerRef} videoId={videoId} depth={depth + 1} />
      ))}
    </div>
  );
}
