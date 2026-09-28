'use client';

import { useMemo, useState } from 'react';
import NoteComposer from './NoteComposer';
import NoteItem from './NoteItem';
import { NOTE_TAGS, NOTE_STATUSES } from '@/lib/constants';

export default function NotesPanel({ video, initialNotes, users, playerRef }) {
  const [tagFilter, setTagFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [authorFilter, setAuthorFilter] = useState('ALL');
  const [sortMode, setSortMode] = useState('TIME');

  const filtered = useMemo(() => {
    let list = initialNotes.filter(
      (n) =>
        (tagFilter === 'ALL' || n.tag === tagFilter) &&
        (statusFilter === 'ALL' || n.status === statusFilter) &&
        (authorFilter === 'ALL' || n.authorId === parseInt(authorFilter, 10))
    );
    list = [...list].sort((a, b) => {
      if (sortMode === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
      const at = a.timestampSeconds ?? Infinity;
      const bt = b.timestampSeconds ?? Infinity;
      return at - bt;
    });
    return list;
  }, [initialNotes, tagFilter, statusFilter, authorFilter, sortMode]);

  return (
    <div className="space-y-4">
      <NoteComposer videoId={video.id} users={users} playerRef={playerRef} />

      <div className="flex flex-wrap gap-2 text-xs">
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-lg border border-lavender-soft px-2 py-1 bg-white">
          <option value="ALL">All tags</option>
          {NOTE_TAGS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-lavender-soft px-2 py-1 bg-white">
          <option value="ALL">All statuses</option>
          {NOTE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="rounded-lg border border-lavender-soft px-2 py-1 bg-white">
          <option value="ALL">Everyone</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className="rounded-lg border border-lavender-soft px-2 py-1 bg-white ml-auto">
          <option value="TIME">By timestamp</option>
          <option value="NEWEST">Newest first</option>
        </select>
      </div>

      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-ink-soft text-sm italic text-center py-8">No notes match these filters yet.</p>
        ) : (
          filtered.map((n) => <NoteItem key={n.id} note={n} users={users} playerRef={playerRef} videoId={video.id} />)
        )}
      </div>
    </div>
  );
}
