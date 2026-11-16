'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NoteComposer from './NoteComposer';
import NoteItem from './NoteItem';
import { NOTE_TAGS, NOTE_CLASSES } from '@/lib/constants';

const STORE_KEY = 'bnt:notes-filters';
const DEFAULTS = { view: 'ALL', tag: 'ALL', cls: 'ALL', author: 'ALL', assignee: 'ALL', sort: 'TIME', follow: false };

const selectCls = 'w-full rounded-lg border border-lavender-soft px-2 py-1 bg-white';

export default function NotesPanel({ video, initialNotes, users, playerRef, time = 0 }) {
  const [f, setF] = useState(DEFAULTS);
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef(null);
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));

  // Filters survive navigation (per browser).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (saved) setF({ ...DEFAULTS, ...saved });
    } catch (e) {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(f));
    } catch (e) {}
  }, [f]);

  const done = (n) => n.status === 'RESOLVED';
  const doneCount = initialNotes.filter(done).length;
  const total = initialNotes.length;

  const filtered = useMemo(() => {
    const list = initialNotes.filter(
      (n) =>
        (f.view === 'ALL' || (f.view === 'DONE' ? done(n) : !done(n))) &&
        (f.tag === 'ALL' || n.tag === f.tag) &&
        (f.cls === 'ALL' || (n.classes || []).includes(f.cls)) &&
        (f.author === 'ALL' || n.authorId === parseInt(f.author, 10)) &&
        (f.assignee === 'ALL' || n.assigneeId === parseInt(f.assignee, 10))
    );
    return list.sort((a, b) => {
      if (f.sort === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
      return (a.timestampSeconds ?? Infinity) - (b.timestampSeconds ?? Infinity);
    });
  }, [initialNotes, f]);

  // Timed notes in time order: the basis for "current note" and j/k stepping.
  const timed = useMemo(
    () => [...filtered].filter((n) => n.timestampSeconds != null).sort((a, b) => a.timestampSeconds - b.timestampSeconds),
    [filtered]
  );
  const currentId = useMemo(() => {
    if (f.sort !== 'TIME') return null;
    let cur = null;
    for (const n of timed) {
      if (n.timestampSeconds <= time + 0.4) cur = n.id;
      else break;
    }
    return cur;
  }, [timed, time, f.sort]);

  // Follow playback: keep the current note in view (only where the list is its own scroller).
  useEffect(() => {
    if (!f.follow || currentId == null) return;
    const box = listRef.current;
    if (!box || box.scrollHeight <= box.clientHeight + 4) return;
    const el = box.querySelector(`[data-note-id="${currentId}"]`);
    if (el) box.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: 'smooth' });
  }, [currentId, f.follow]);

  // j / k: jump to the next / previous note on the timeline.
  const step = useCallback(
    (dir) => {
      const p = playerRef.current;
      const now = p?.getCurrentTime?.();
      if (!p || typeof now !== 'number' || timed.length === 0) return;
      const target =
        dir > 0
          ? timed.find((n) => n.timestampSeconds > now + 0.6)
          : [...timed].reverse().find((n) => n.timestampSeconds < now - 1.2);
      if (target) p.seekTo?.(target.timestampSeconds, true);
    },
    [playerRef, timed]
  );
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== 'j' && e.key !== 'k') return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      e.preventDefault();
      step(e.key === 'j' ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const activeFilters = ['tag', 'cls', 'author', 'assignee'].filter((k) => f[k] !== 'ALL').length + (f.sort !== 'TIME' ? 1 : 0);
  const clearFilters = () => set({ tag: 'ALL', cls: 'ALL', author: 'ALL', assignee: 'ALL', sort: 'TIME' });

  const views = [
    { value: 'ALL', label: 'All', count: total },
    { value: 'TODO', label: 'To do', count: total - doneCount },
    { value: 'DONE', label: 'Done', count: doneCount },
  ];

  return (
    <div className="space-y-3">
      <NoteComposer videoId={video.id} users={users} playerRef={playerRef} />

      {total > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-ink-soft mb-1">
            <span className="tabular">
              {doneCount === total ? 'All notes resolved ✓' : `${doneCount} of ${total} resolved`}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={f.follow} onChange={(e) => set({ follow: e.target.checked })} />
              Follow playback
            </label>
          </div>
          <div className="h-1.5 rounded-full bg-lavender-soft overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneCount} aria-label="Notes resolved">
            <div className="h-full bg-[#2F6A3E] transition-[width] duration-500 ease-out" style={{ width: `${(doneCount / total) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="inline-flex rounded-full bg-white/70 border border-lavender-soft p-0.5" role="group" aria-label="Show notes">
          {views.map((v) => (
            <button
              key={v.value}
              onClick={() => set({ view: v.value })}
              aria-pressed={f.view === v.value}
              className={`px-3 py-1 rounded-full text-xs font-medium ${f.view === v.value ? 'bg-lavender text-ink' : 'text-ink-soft hover:text-ink'}`}
            >
              {v.label} <span className="tabular opacity-70">{v.count}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className="text-xs text-ink-soft hover:text-ink underline decoration-dotted"
        >
          Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
        </button>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="text-xs text-ink-soft hover:text-ink underline decoration-dotted">
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-ink-soft hidden sm:inline">J / K: next / previous note</span>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-2 text-xs rounded-xl bg-lavender-soft/50 p-3">
          <select aria-label="Feedback type" value={f.tag} onChange={(e) => set({ tag: e.target.value })} className={selectCls}>
            <option value="ALL">Any feedback type</option>
            {NOTE_TAGS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select aria-label="Department" value={f.cls} onChange={(e) => set({ cls: e.target.value })} className={selectCls}>
            <option value="ALL">Any department</option>
            {NOTE_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <select aria-label="Written by" value={f.author} onChange={(e) => set({ author: e.target.value })} className={selectCls}>
            <option value="ALL">Written by anyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select aria-label="Assigned to" value={f.assignee} onChange={(e) => set({ assignee: e.target.value })} className={selectCls}>
            <option value="ALL">Assigned to anyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select aria-label="Sort" value={f.sort} onChange={(e) => set({ sort: e.target.value })} className={`${selectCls} col-span-2`}>
            <option value="TIME">Sort by timestamp</option>
            <option value="NEWEST">Sort newest first</option>
          </select>
        </div>
      )}

      <div ref={listRef} className="relative space-y-3 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
        {filtered.length === 0 ? (
          <p className="text-ink-soft text-sm italic text-center py-8">
            {total === 0 ? 'No notes yet. Press N to add the first one.' : 'No notes match these filters.'}
          </p>
        ) : (
          filtered.map((n) => (
            <NoteItem key={n.id} note={n} users={users} playerRef={playerRef} videoId={video.id} isCurrent={n.id === currentId} />
          ))
        )}
      </div>
    </div>
  );
}
