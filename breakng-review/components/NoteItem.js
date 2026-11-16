'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleReactionAction, updateNoteFieldAction } from '@/app/videos/[id]/actions';
import { NOTE_TAGS, NOTE_STATUSES, tagInfo, classLabels } from '@/lib/constants';
import { formatRange } from '@/lib/time';
import { splitMentionSegments } from '@/lib/mentions';
import NoteComposer from './NoteComposer';
import ClassPicker from './ClassPicker';

// Status is drawn, not coloured: hollow ring = open, half ring = in progress, filled check = resolved.
// (Pastel fills are reserved for tags, so a colour never means two things.)
function StatusGlyph({ status }) {
  if (status === 'RESOLVED') {
    return (
      <svg viewBox="0 0 20 20" className="w-5 h-5" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#2F6A3E" />
        <path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="#544E75" strokeWidth="1.75" />
      {status === 'IN_PROGRESS' && <path d="M10 1.75a8.25 8.25 0 0 1 0 16.5z" fill="#544E75" />}
    </svg>
  );
}

const STATUS_LABEL = { OPEN: 'Open', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved' };

export default function NoteItem({ note, users, playerRef, videoId, depth = 0, isCurrent = false }) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(note.status);
  const [undo, setUndo] = useState(false);
  const undoTimer = useRef(null);
  useEffect(() => setStatus(note.status), [note.status]);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const tInfo = tagInfo(note.tag);
  const cls = classLabels(note.classes);
  const assignee = note.assignee || users.find((u) => u.id === note.assigneeId) || null;
  const resolved = status === 'RESOLVED';

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

  // One tap: resolve (or reopen). Finer states live in the edit panel.
  const toggleResolved = async () => {
    const next = resolved ? 'OPEN' : 'RESOLVED';
    setStatus(next);
    clearTimeout(undoTimer.current);
    if (next === 'RESOLVED') {
      setUndo(true);
      undoTimer.current = setTimeout(() => setUndo(false), 6000);
    } else {
      setUndo(false);
    }
    const res = await updateNoteFieldAction(note.id, videoId, 'status', next);
    if (res?.error) setStatus(note.status);
    router.refresh();
  };

  const segments = splitMentionSegments(note.text, users);

  if (depth > 0) {
    return (
      <div className="ml-5 pl-3 border-l border-lavender mt-3">
        <div className="flex items-center gap-2 text-xs mb-1">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: note.author?.color || '#eee' }}
          >
            {note.author?.name?.[0]?.toUpperCase() || '?'}
          </span>
          <span className="font-medium">{note.author?.name || 'Unknown'}</span>
        </div>
        <NoteBody segments={segments} />
      </div>
    );
  }

  return (
    <div
      data-note-id={note.id}
      className={`bg-white/70 rounded-2xl p-4 border transition-colors ${isCurrent ? 'border-[#6D63B0] ring-2 ring-lavender' : 'border-lavender-soft'} ${resolved ? 'opacity-75' : ''}`}
      aria-current={isCurrent ? 'true' : undefined}
    >
      <div className="flex items-center gap-2 flex-wrap text-xs mb-1.5">
        <button
          onClick={toggleResolved}
          aria-label={resolved ? 'Reopen this note' : 'Mark this note resolved'}
          title={resolved ? 'Resolved. Tap to reopen' : `${STATUS_LABEL[status] || 'Open'}. Tap to resolve`}
          className="status-toggle w-8 h-8 -ml-1 shrink-0 inline-flex items-center justify-center rounded-full hover:bg-lavender-soft transition"
        >
          <StatusGlyph status={status} />
        </button>

        {note.timestampSeconds != null && (
          <button onClick={jump} className="px-2 py-0.5 rounded-full bg-sky-soft font-mono font-semibold tabular hover:brightness-95">
            {formatRange(note.timestampSeconds, note.endTimestampSeconds)}
          </button>
        )}

        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: note.author?.color || '#eee' }}
        >
          {note.author?.name?.[0]?.toUpperCase() || '?'}
        </span>
        <span className="font-medium truncate min-w-[6rem] flex-1">{note.author?.name || 'Unknown'}</span>

        <button
          onClick={() => setEditing((e) => !e)}
          aria-expanded={editing}
          className="shrink-0 text-ink-soft hover:text-ink underline decoration-dotted"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {(note.tag !== 'GENERAL' || assignee || cls.length > 0 || status === 'IN_PROGRESS') && !editing && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs">
          {note.tag !== 'GENERAL' && (
            <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: tInfo.color, color: tInfo.text }}>
              {tInfo.label}
            </span>
          )}
          {cls.map((c) => (
            <span key={c.value} className="rounded-full bg-lavender-soft px-2 py-0.5" title={c.label}>
              <span aria-hidden="true">{c.emoji}</span> {c.label}
            </span>
          ))}
          {status === 'IN_PROGRESS' && <span className="rounded-full border border-ink-soft px-2 py-0.5">In progress</span>}
          {assignee && <span className="rounded-full border border-lavender px-2 py-0.5">→ {assignee.name}</span>}
        </div>
      )}

      {editing && (
        <div className="mb-2 space-y-2 rounded-xl bg-lavender-soft/50 p-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-1">
              Feedback type
              <select value={note.tag} onChange={(e) => changeField('tag', e.target.value)} className="rounded-lg border border-lavender-soft px-2 py-1 bg-white">
                {NOTE_TAGS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1">
              Status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  changeField('status', e.target.value);
                }}
                className="rounded-lg border border-lavender-soft px-2 py-1 bg-white"
              >
                {NOTE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1">
              Assigned to
              <select
                value={note.assigneeId || ''}
                onChange={(e) => changeField('assigneeId', e.target.value ? parseInt(e.target.value, 10) : null)}
                className="rounded-lg border border-lavender-soft px-2 py-1 bg-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs">Department</p>
          <ClassPicker value={note.classes || []} onChange={(v) => changeField('classes', v)} />
        </div>
      )}

      <NoteBody segments={segments} large />

      {undo && (
        <p role="status" className="mt-2 flex items-center gap-2 text-xs rounded-lg bg-mint-soft px-2 py-1">
          Marked resolved.
          <button onClick={toggleResolved} className="font-semibold underline">Undo</button>
        </p>
      )}

      <div className="flex items-center gap-3 mt-2 text-xs text-ink-soft">
        <button onClick={react} className={`px-2 py-0.5 rounded-full ${note.reactedByMe ? 'bg-butter text-ink' : 'bg-ink/5'}`}>
          <span aria-hidden="true">👍</span> {note.reactionCount || ''}
          <span className="sr-only">Agree</span>
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

function NoteBody({ segments, large }) {
  return (
    <p className={`${large ? 'text-[0.95rem]' : 'text-sm'} leading-relaxed whitespace-pre-wrap max-w-[70ch]`}>
      {segments.map((seg, i) =>
        seg.type === 'mention' ? (
          <span key={i} className="bg-lavender-soft text-ink font-medium rounded px-1">{seg.value}</span>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </p>
  );
}
