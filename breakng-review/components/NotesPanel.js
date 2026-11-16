'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NoteComposer from './NoteComposer';
import NoteItem from './NoteItem';
import { NOTE_TAGS, NOTE_CLASSES } from '@/lib/constants';
import { formatTimestamp } from '@/lib/time';

const STORE_KEY = 'bnt:notes-filters';
const DEFAULTS = { view: 'ALL', mine: false, tag: 'ALL', author: 'ALL', assignee: 'ALL', sort: 'TIME', follow: false };

const selectCls = 'w-full rounded-lg border border-lavender-soft px-2 py-1 bg-white';

// dept / onDeptChange: the one department filter, shared with the timeline above the player.
export default function NotesPanel({ video, initialNotes, users, playerRef, time = 0, currentUserId, dept = 'ALL', onDeptChange }) {
  const [f, setF] = useState(DEFAULTS);
  const [showFilters, setShowFilters] = useState(false);
  const [typing, setTyping] = useState(false);
  const [composerVisible, setComposerVisible] = useState(true);
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

  // Phones: hide the "Add note" bar while a field is focused (keyboard up) or the composer is on screen.
  useEffect(() => {
    const onIn = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.tagName === 'SELECT')) setTyping(true);
    };
    const onOut = () => setTyping(false);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    const ta = document.querySelector('textarea[aria-label="New note"]');
    let io;
    if (ta && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => setComposerVisible(entry.isIntersecting), { threshold: 0.6 });
      io.observe(ta);
    }
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
      io?.disconnect();
    };
  }, []);

  const done = (n) => n.status === 'RESOLVED';
  const doneCount = initialNotes.filter(done).length;
  const total = initialNotes.length;

  // Departments used on this video (plus "none"), with counts. This is the single department control.
  const deptChips = useMemo(() => {
    const counts = {};
    let none = 0;
    for (const n of initialNotes) {
      const cls = n.classes || [];
      if (cls.length === 0) none += 1;
      for (const c of cls) counts[c] = (counts[c] || 0) + 1;
    }
    const chips = NOTE_CLASSES.filter((c) => counts[c.value]).map((c) => ({ value: c.value, emoji: c.emoji, short: c.short, label: c.label, count: counts[c.value] }));
    if (none > 0) chips.push({ value: 'NONE', emoji: null, short: 'No dept', label: 'No department', count: none });
    return chips;
  }, [initialNotes]);

  const filtered = useMemo(() => {
    const list = initialNotes.filter(
      (n) =>
        (f.view === 'ALL' || (f.view === 'DONE' ? done(n) : !done(n))) &&
        (!f.mine || n.assigneeId === currentUserId) &&
        (f.tag === 'ALL' || n.tag === f.tag) &&
        (dept === 'ALL' || (dept === 'NONE' ? (n.classes || []).length === 0 : (n.classes || []).includes(dept))) &&
        (f.author === 'ALL' || n.authorId === parseInt(f.author, 10)) &&
        (f.assignee === 'ALL' || n.assigneeId === parseInt(f.assignee, 10))
    );
    return list.sort((a, b) => {
      if (f.sort === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
      return (a.timestampSeconds ?? Infinity) - (b.timestampSeconds ?? Infinity);
    });
  }, [initialNotes, f, dept, currentUserId]);

  // With one author the name on every card is noise, so cards hide it.
  const singleAuthor = useMemo(() => new Set(initialNotes.map((n) => n.authorId)).size <= 1, [initialNotes]);

  // Timed notes in time order: the basis for "current note" and j/k stepping.
  const timed = useMemo(
    () => [...filtered].filter((n) => n.timestampSeconds != null).sort((a, b) => a.timestampSeconds - b.timestampSeconds),
    [filtered]
  );
  const currentNote = useMemo(() => {
    if (f.sort !== 'TIME') return null;
    let cur = null;
    for (const n of timed) {
      if (n.timestampSeconds <= time + 0.4) cur = n;
      else break;
    }
    return cur;
  }, [timed, time, f.sort]);
  const currentId = currentNote?.id ?? null;

  const scrollToNote = useCallback((id, smooth = true) => {
    const box = listRef.current;
    const el = box?.querySelector(`[data-note-id="${id}"]`);
    if (!box || !el) return;
    if (box.scrollHeight > box.clientHeight + 4) {
      box.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: smooth ? 'smooth' : 'auto' });
    } else {
      el.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Follow playback: keep the current note in view (only inside the list's own scroller).
  useEffect(() => {
    if (!f.follow || currentId == null) return;
    const box = listRef.current;
    if (!box || box.scrollHeight <= box.clientHeight + 4) return;
    scrollToNote(currentId);
  }, [currentId, f.follow, scrollToNote]);

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

  const openComposer = () => {
    const ta = document.querySelector('textarea[aria-label="New note"]');
    ta?.focus();
    ta?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const activeFilters =
    ['tag', 'author', 'assignee'].filter((k) => f[k] !== 'ALL').length + (f.sort !== 'TIME' ? 1 : 0) + (f.mine ? 1 : 0) + (dept !== 'ALL' ? 1 : 0);
  const clearFilters = () => {
    set({ mine: false, tag: 'ALL', author: 'ALL', assignee: 'ALL', sort: 'TIME' });
    onDeptChange?.('ALL');
  };

  const views = [
    { value: 'ALL', label: 'All', count: total },
    { value: 'TODO', label: 'To do', count: total - doneCount },
    { value: 'DONE', label: 'Done', count: doneCount },
  ];

  return (
    <div className="space-y-3 pb-20 lg:pb-0">
      <NoteComposer videoId={video.id} users={users} playerRef={playerRef} time={time} />

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

      {currentNote && !f.follow && (
        <button
          onClick={() => scrollToNote(currentNote.id)}
          className="pill w-full text-left text-xs rounded-lg bg-white/70 border border-lavender px-3 py-1.5 hover:bg-lavender-soft"
        >
          <span className="tabular font-semibold">Now at {formatTimestamp(time)}</span>
          <span className="text-ink-soft"> · jump to the note at {formatTimestamp(currentNote.timestampSeconds)}</span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="inline-flex rounded-full bg-white/70 border border-lavender-soft p-0.5" role="group" aria-label="Show notes">
          {views.map((v) => (
            <button
              key={v.value}
              onClick={() => set({ view: v.value })}
              aria-pressed={f.view === v.value}
              className={`pill px-3 py-1 rounded-full text-xs font-medium ${f.view === v.value ? 'bg-lavender text-ink' : 'text-ink-soft hover:text-ink'}`}
            >
              {v.label} <span className="tabular opacity-70">{v.count}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => set({ mine: !f.mine })}
          aria-pressed={f.mine}
          className={`pill px-3 py-1 rounded-full text-xs font-medium border ${f.mine ? 'bg-lavender border-lavender text-ink' : 'bg-white/70 border-lavender-soft text-ink-soft hover:text-ink'}`}
        >
          Assigned to me
        </button>
        <button
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className="pill text-xs text-ink-soft hover:text-ink underline decoration-dotted"
        >
          More filters
        </button>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="pill text-xs text-ink-soft hover:text-ink underline decoration-dotted">
            Clear ({activeFilters})
          </button>
        )}
        <span className="ml-auto text-xs text-ink-soft hidden sm:inline">J / K: next / previous note</span>
      </div>

      {/* The one department control: filters this list and the markers on the timeline. */}
      {deptChips.length > 0 && (
        <div role="group" aria-label="Department. Filters the list and the timeline">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {deptChips.map((c) => {
              const on = dept === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => onDeptChange?.(on ? 'ALL' : c.value)}
                  aria-pressed={on}
                  title={c.label}
                  className={`pill shrink-0 rounded-full border px-2.5 py-1 text-xs ${on ? 'bg-lavender border-lavender text-ink font-medium' : 'bg-white/70 border-lavender-soft text-ink-soft hover:text-ink'}`}
                >
                  {c.emoji ? <span aria-hidden="true">{c.emoji} </span> : null}
                  {c.short} <span className="tabular opacity-70">{c.count}</span>
                  <span className="sr-only"> ({c.label})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="grid grid-cols-2 gap-2 text-xs rounded-xl bg-lavender-soft/50 p-3">
          <select aria-label="Feedback type" value={f.tag} onChange={(e) => set({ tag: e.target.value })} className={selectCls}>
            <option value="ALL">Any feedback type</option>
            {NOTE_TAGS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
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
          <select aria-label="Sort" value={f.sort} onChange={(e) => set({ sort: e.target.value })} className={selectCls}>
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
            <NoteItem
              key={n.id}
              note={n}
              users={users}
              playerRef={playerRef}
              videoId={video.id}
              isCurrent={n.id === currentId}
              showAuthor={!singleAuthor}
            />
          ))
        )}
      </div>

      {/* Phones: a one-tap way back to the composer once it has scrolled off screen. */}
      {!typing && !composerVisible && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-paper/95 border-t border-lavender-soft backdrop-blur no-print">
          <button onClick={openComposer} className="w-full rounded-xl bg-[#6D63B0] text-white font-semibold text-sm py-2.5 tabular">
            + Add note{time > 0 ? ` at ${formatTimestamp(time)}` : ''}
          </button>
        </div>
      )}
    </div>
  );
}
