'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleReactionAction, updateNoteFieldAction, editNoteTextAction, deleteNoteAction } from '@/app/videos/[id]/actions';
import { NOTE_TAGS, NOTE_STATUSES, tagInfo, classLabels } from '@/lib/constants';

const shortName = (name) => (name || 'Unknown').split(/[\s-]+/)[0];
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

export default function NoteItem({ note, users, playerRef, videoId, depth = 0, isCurrent = false, showAuthor = true, compact = false }) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openCompact, setOpenCompact] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const [textError, setTextError] = useState(null);
  const [savingText, setSavingText] = useState(false);
  const [editingReply, setEditingReply] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteTimer = useRef(null);
  useEffect(() => setDraft(note.text), [note.text]);
  useEffect(() => () => clearTimeout(deleteTimer.current), []);
  const [status, setStatus] = useState(note.status);
  const [undo, setUndo] = useState(false);
  const undoTimer = useRef(null);
  useEffect(() => setStatus(note.status), [note.status]);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const tInfo = tagInfo(note.tag);
  const cls = classLabels(note.classes);
  const assignee = note.assignee || users.find((u) => u.id === note.assigneeId) || null;
  const resolved = status === 'RESOLVED';
  const deptColor = cls[0]?.color;

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

  const segments = splitMentionSegments(note.text.trim(), users);

  const saveText = async () => {
    const next = draft.trim();
    if (!next || next === note.text.trim()) {
      setEditingReply(false);
      return;
    }
    setSavingText(true);
    setTextError(null);
    const res = await editNoteTextAction(note.id, videoId, next);
    setSavingText(false);
    if (res?.error) return setTextError(res.error);
    setEditingReply(false);
    router.refresh();
  };

  // Delete waits 6 seconds so it can be undone; closing the page inside that window cancels it.
  const startDelete = () => {
    setDeleting(true);
    deleteTimer.current = setTimeout(async () => {
      const res = await deleteNoteAction(note.id, videoId);
      if (res?.error) setDeleting(false);
      else router.refresh();
    }, 6000);
  };
  const undoDelete = () => {
    clearTimeout(deleteTimer.current);
    setDeleting(false);
  };

  if (deleting) {
    return (
      <div
        data-note-id={note.id}
        role="status"
        className={`flex items-center gap-2 text-sm rounded-xl border border-lavender-soft bg-white/60 px-3 py-2 ${depth > 0 ? 'ml-5 mt-3' : ''}`}
      >
        {depth > 0 ? 'Reply' : 'Note'} deleted.
        <button onClick={undoDelete} className="pill font-semibold underline">Undo</button>
      </div>
    );
  }
  const tint = deptColor && !resolved ? { backgroundColor: `${deptColor}66` } : undefined;
  const ring = isCurrent ? 'border-accent ring-2 ring-lavender' : 'border-lavender-soft';

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
        {editingReply ? (
          <div className="space-y-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditingReply(false);
                  setDraft(note.text);
                }
              }}
              aria-label="Edit reply"
              rows={2}
              className="w-full rounded-lg border border-lavender-soft px-2 py-1.5 text-sm bg-white"
            />
            {textError && <p role="alert" className="text-xs bg-rose-soft rounded px-2 py-1">{textError}</p>}
            <div className="flex gap-2 text-xs">
              <button onClick={saveText} disabled={savingText} className="pill font-semibold bg-accent text-white px-3 py-1 rounded-lg">{savingText ? 'Saving…' : 'Save'}</button>
              <button onClick={() => { setEditingReply(false); setDraft(note.text); }} className="pill text-ink-soft px-2">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <NoteBody segments={segments} />
            <div className="note-actions mt-1 flex gap-3 text-xs text-ink-soft">
              <button onClick={() => setEditingReply(true)} className="pill hover:text-ink underline decoration-dotted" aria-label="Edit reply">Edit</button>
              <button onClick={startDelete} className="pill hover:text-ink underline decoration-dotted" aria-label="Delete reply">Delete</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Compact mode: one dense row per note; tap the text to open the full note.
  if (compact && !openCompact) {
    const lines = note.text.trim().split('\n');
    return (
      <div
        data-note-id={note.id}
        style={tint}
        className={`note-card bg-white/70 rounded-xl border px-2 py-1 flex items-center gap-2 text-sm transition-colors ${ring} ${resolved ? 'opacity-75' : ''}`}
        aria-current={isCurrent ? 'true' : undefined}
      >
        <button
          onClick={toggleResolved}
          aria-label={resolved ? 'Reopen this note' : 'Mark this note resolved'}
          title={resolved ? 'Resolved. Tap to reopen' : `${STATUS_LABEL[status] || 'Open'}. Tap to resolve`}
          className="status-toggle w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-full hover:bg-lavender-soft transition"
        >
          <StatusGlyph status={status} />
        </button>
        {note.timestampSeconds != null && (
          <button onClick={jump} className="pill shrink-0 px-2 py-0.5 rounded-full bg-sky-soft font-mono text-xs font-semibold tabular hover:brightness-95">
            {formatRange(note.timestampSeconds, note.endTimestampSeconds)}
          </button>
        )}
        {cls.length > 0 && (
          <span className="shrink-0 text-sm" title={cls.map((c) => c.label).join(', ')}>
            {cls.map((c) => (
              <span key={c.value} aria-hidden="true">{c.emoji}</span>
            ))}
            <span className="sr-only">{cls.map((c) => c.label).join(', ')}</span>
          </span>
        )}
        <button
          onClick={() => setOpenCompact(true)}
          aria-label={`Open note: ${lines[0]}`}
          className="min-w-0 flex-1 truncate text-left hover:underline decoration-dotted"
        >
          {lines[0]}
          {lines.length > 1 ? ' …' : ''}
        </button>
        {note.replies?.length > 0 && <span className="shrink-0 text-xs text-ink-soft tabular">{note.replies.length} repl{note.replies.length === 1 ? 'y' : 'ies'}</span>}
        {undo && (
          <button onClick={toggleResolved} className="shrink-0 text-xs font-semibold underline">Undo</button>
        )}
      </div>
    );
  }

  return (
    <div
      data-note-id={note.id}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        if (editing) setEditing(false);
        else if (compact && openCompact) setOpenCompact(false);
      }}
      style={tint}
      className={`note-card bg-white/70 rounded-2xl p-4 border transition-colors ${ring} ${resolved ? 'opacity-75' : ''}`}
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
          <button onClick={jump} className="pill px-2 py-0.5 rounded-full bg-sky-soft font-mono font-semibold tabular hover:brightness-95">
            {formatRange(note.timestampSeconds, note.endTimestampSeconds)}
          </button>
        )}

        {showAuthor ? (
          <>
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: note.author?.color || '#eee' }}
            >
              {note.author?.name?.[0]?.toUpperCase() || '?'}
            </span>
            <span className="text-ink-soft truncate min-w-[3rem] flex-1" title={note.author?.name}>
              <span className="sm:hidden">{shortName(note.author?.name)}</span>
              <span className="hidden sm:inline">{note.author?.name || 'Unknown'}</span>
            </span>
          </>
        ) : (
          <span className="flex-1" />
        )}

        <button
          onClick={() => setEditing((e) => !e)}
          aria-expanded={editing}
          aria-label={editing ? 'Close editing' : `Edit note${note.timestampSeconds != null ? ` at ${formatRange(note.timestampSeconds, note.endTimestampSeconds)}` : ''}`}
          className="pill shrink-0 text-ink-soft hover:text-ink underline decoration-dotted"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
        {compact && (
          <button onClick={() => { setOpenCompact(false); setEditing(false); }} className="pill shrink-0 text-ink-soft hover:text-ink underline decoration-dotted">
            Collapse
          </button>
        )}
      </div>

      {(note.tag !== 'GENERAL' || assignee || cls.length > 0 || status === 'IN_PROGRESS') && !editing && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs">
          {note.tag !== 'GENERAL' && (
            <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: tInfo.color, color: tInfo.text }}>
              {tInfo.label}
            </span>
          )}
          {cls.map((c) => (
            <span key={c.value} className="rounded-full bg-white/80 px-2 py-0.5" style={{ border: `1px solid ${c.color}` }} title={c.label}>
              <span aria-hidden="true">{c.emoji}</span> {c.label}
            </span>
          ))}
          {status === 'IN_PROGRESS' && <span className="rounded-full border border-ink-soft px-2 py-0.5">In progress</span>}
          {assignee && <span className="rounded-full border border-lavender px-2 py-0.5">→ {assignee.name}</span>}
        </div>
      )}

      {editing && (
        <div className="mb-2 space-y-2 rounded-xl bg-lavender-soft/50 p-3">
          <label className="block text-xs">
            Note text
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(8, Math.max(2, draft.split('\n').length))}
              className="mt-1 w-full rounded-lg border border-lavender-soft px-2 py-1.5 text-sm bg-white"
            />
          </label>
          {textError && <p role="alert" className="text-xs bg-rose-soft rounded px-2 py-1">{textError}</p>}
          {draft.trim() !== note.text.trim() && (
            <div className="flex gap-2 text-xs">
              <button onClick={saveText} disabled={savingText || !draft.trim()} className="pill font-semibold bg-accent text-white px-3 py-1 rounded-lg disabled:opacity-50">
                {savingText ? 'Saving…' : 'Save text'}
              </button>
              <button onClick={() => setDraft(note.text)} className="pill text-ink-soft px-2">Reset</button>
            </div>
          )}
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
          <button onClick={startDelete} className="pill text-xs text-danger hover:underline">
            Delete this note
          </button>
        </div>
      )}

      <NoteBody segments={segments} large />

      {undo && (
        <p role="status" className="mt-2 flex items-center gap-2 text-xs rounded-lg bg-mint-soft px-2 py-1">
          Marked resolved.
          <button onClick={toggleResolved} className="font-semibold underline">Undo</button>
        </p>
      )}

      <div className={`note-actions flex items-center gap-3 mt-2 text-xs text-ink-soft ${replying || note.replies?.length > 0 || note.reactionCount > 0 || note.reactedByMe ? 'always' : ''}`}>
        <button onClick={react} className={`pill px-2 py-0.5 rounded-full ${note.reactedByMe ? 'bg-butter text-ink' : 'bg-ink/5'}`}>
          <span aria-hidden="true">👍</span> {note.reactionCount || ''}
          <span className="sr-only">Agree</span>
        </button>
        <button onClick={() => setReplying((r) => !r)} className="pill hover:text-ink">
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
