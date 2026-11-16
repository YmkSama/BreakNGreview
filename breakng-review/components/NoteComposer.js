'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNoteAction } from '@/app/videos/[id]/actions';
import { NOTE_TAGS } from '@/lib/constants';
import { formatTimestamp } from '@/lib/time';
import ClassPicker from './ClassPicker';

export default function NoteComposer({ videoId, users, playerRef, parentId, compact, onDone }) {
  const router = useRouter();
  const textRef = useRef(null);
  const [text, setText] = useState('');
  const [tag, setTag] = useState('GENERAL');
  const [classes, setClasses] = useState([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [capturedStart, setCapturedStart] = useState(null);
  const [capturedEnd, setCapturedEnd] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [showMore, setShowMore] = useState(false);

  const currentTime = () => {
    const t = playerRef?.current?.getCurrentTime?.();
    return typeof t === 'number' ? t : null;
  };
  const captureStart = () => {
    const t = currentTime();
    if (t !== null) setCapturedStart(t);
  };
  const captureEnd = () => {
    const t = currentTime();
    if (t !== null) setCapturedEnd(t);
  };

  // Press N anywhere (outside a field) to jump into a new note at the current moment.
  useEffect(() => {
    if (parentId) return;
    const onKey = (e) => {
      if (e.key !== 'n' && e.key !== 'N') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      e.preventDefault();
      textRef.current?.focus();
      textRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [parentId]);

  // Stamp the playhead when you start writing, unless you already marked a time.
  const onFocusText = () => {
    if (!parentId && capturedStart === null) captureStart();
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!text.trim() || pending) return;
    if (!parentId && isRange && capturedStart !== null && (capturedEnd === null || capturedEnd <= capturedStart)) {
      setError('Mark an end time after the start, or untick "range".');
      return;
    }
    setPending(true);
    setError(null);

    const res = await createNoteAction({
      videoId,
      parentId: parentId || null,
      timestampSeconds: parentId ? null : capturedStart,
      endTimestampSeconds: parentId ? null : (isRange ? capturedEnd : null),
      text,
      tag: parentId ? 'GENERAL' : tag,
      classes: parentId ? [] : classes,
      status: 'OPEN',
      assigneeId: parentId ? null : (assigneeId || null),
    });

    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setText('');
    setClasses([]);
    setCapturedStart(null);
    setCapturedEnd(null);
    setIsRange(false);
    router.refresh();
    if (onDone) onDone();
  };

  // Enter posts; Shift+Enter makes a new line.
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className={compact ? 'mt-2 space-y-2' : 'space-y-2 bg-white/70 rounded-2xl p-4 border border-lavender-soft'}
    >
      {!parentId && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={captureStart}
            className="px-2.5 py-1 rounded-lg bg-sky-soft text-ink font-medium tabular"
            title="Re-mark the current video time"
          >
            {capturedStart !== null ? `⏱ ${formatTimestamp(capturedStart)} · re-mark` : '⏱ Mark current time'}
          </button>
          <label className="flex items-center gap-1 text-ink-soft">
            <input type="checkbox" checked={isRange} onChange={(e) => setIsRange(e.target.checked)} /> range
          </label>
          {isRange && (
            <button type="button" onClick={captureEnd} className="px-2.5 py-1 rounded-lg bg-sky-soft text-ink font-medium tabular">
              {capturedEnd !== null ? `→ ${formatTimestamp(capturedEnd)}` : '→ Mark end'}
            </button>
          )}
        </div>
      )}

      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={onFocusText}
        onKeyDown={onKeyDown}
        aria-label={parentId ? 'Reply' : 'New note'}
        placeholder={parentId ? 'Write a reply… @mention a teammate' : 'Add a note at this moment… @mention a teammate'}
        className="w-full rounded-xl border border-lavender-soft px-3 py-2 text-sm resize-none bg-white"
        rows={compact ? 2 : 3}
      />

      {!parentId && <ClassPicker value={classes} onChange={setClasses} />}

      {!parentId && (
        <div>
          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            aria-expanded={showMore}
            className="text-xs text-ink-soft hover:text-ink underline decoration-dotted"
          >
            {showMore ? 'Hide tag & assignee' : 'Tag & assignee'}
            {!showMore && (tag !== 'GENERAL' || assigneeId) ? ' (set)' : ''}
          </button>
          {showMore && (
            <div className="flex gap-2 flex-wrap mt-2">
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                aria-label="Tag"
                className="rounded-lg border border-lavender-soft px-2 py-1 text-xs bg-white"
              >
                {NOTE_TAGS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                aria-label="Assign to"
                className="rounded-lg border border-lavender-soft px-2 py-1 text-xs bg-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-ink bg-rose-soft rounded-lg px-2 py-1">{error}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink-soft hidden sm:block text-balance">
          Enter to post · Shift+Enter for a new line{!parentId && ' · N to start a note'}
        </p>
        <div className="flex gap-2 ml-auto">
          {onDone && (
            <button type="button" onClick={onDone} className="text-xs text-ink-soft px-3 py-1.5">
              Cancel
            </button>
          )}
          <button disabled={pending || !text.trim()} className="text-sm font-semibold bg-lavender text-ink px-4 py-1.5 rounded-lg disabled:opacity-60">
            {pending ? 'Posting…' : parentId ? 'Reply' : 'Add note'}
          </button>
        </div>
      </div>
    </form>
  );
}
