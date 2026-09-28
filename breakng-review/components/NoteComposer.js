'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNoteAction } from '@/app/videos/[id]/actions';
import { NOTE_TAGS } from '@/lib/constants';
import { formatTimestamp } from '@/lib/time';

export default function NoteComposer({ videoId, users, playerRef, parentId, compact, onDone }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [tag, setTag] = useState('GENERAL');
  const [assigneeId, setAssigneeId] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [capturedStart, setCapturedStart] = useState(null);
  const [capturedEnd, setCapturedEnd] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const captureStart = () => {
    const t = playerRef.current?.getCurrentTime?.();
    if (typeof t === 'number') setCapturedStart(t);
  };
  const captureEnd = () => {
    const t = playerRef.current?.getCurrentTime?.();
    if (typeof t === 'number') setCapturedEnd(t);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPending(true);
    setError(null);

    const res = await createNoteAction({
      videoId,
      parentId: parentId || null,
      timestampSeconds: parentId ? null : capturedStart,
      endTimestampSeconds: parentId ? null : (isRange ? capturedEnd : null),
      text,
      tag: parentId ? 'GENERAL' : tag,
      status: 'OPEN',
      assigneeId: parentId ? null : (assigneeId || null),
    });

    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setText('');
    setCapturedStart(null);
    setCapturedEnd(null);
    router.refresh();
    if (onDone) onDone();
  };

  return (
    <form onSubmit={submit} className={compact ? 'mt-2 space-y-2' : 'space-y-2 bg-white/70 rounded-2xl p-4 border border-lavender-soft'}>
      {!parentId && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button type="button" onClick={captureStart} className="px-2 py-1 rounded-lg bg-sky-soft text-ink font-medium">
            {capturedStart !== null ? `⏱ ${formatTimestamp(capturedStart)}` : '⏱ Mark current time'}
          </button>
          <label className="flex items-center gap-1 text-ink-soft">
            <input type="checkbox" checked={isRange} onChange={(e) => setIsRange(e.target.checked)} /> range
          </label>
          {isRange && (
            <button type="button" onClick={captureEnd} className="px-2 py-1 rounded-lg bg-sky-soft text-ink font-medium">
              {capturedEnd !== null ? `→ ${formatTimestamp(capturedEnd)}` : '→ Mark end'}
            </button>
          )}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={parentId ? 'Write a reply… @mention a teammate' : "What's on your mind? @mention a teammate"}
        className="w-full rounded-xl border border-lavender-soft px-3 py-2 text-sm resize-none bg-white"
        rows={compact ? 2 : 3}
      />

      {!parentId && (
        <div className="flex gap-2 flex-wrap">
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="rounded-lg border border-lavender-soft px-2 py-1 text-xs bg-white">
            {NOTE_TAGS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="rounded-lg border border-lavender-soft px-2 py-1 text-xs bg-white">
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-xs text-ink bg-rose-soft rounded-lg px-2 py-1">{error}</p>}

      <div className="flex justify-end gap-2">
        {onDone && (
          <button type="button" onClick={onDone} className="text-xs text-ink-soft px-3 py-1.5">
            Cancel
          </button>
        )}
        <button disabled={pending} className="text-xs font-semibold bg-lavender text-ink px-3 py-1.5 rounded-lg disabled:opacity-60">
          {pending ? 'Posting…' : parentId ? 'Reply' : 'Add note'}
        </button>
      </div>
    </form>
  );
}
