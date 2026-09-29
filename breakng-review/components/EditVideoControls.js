'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateVideoAction, deleteVideoAction } from '@/app/videos/actions';
import { VIDEO_TYPES } from '@/lib/constants';

export default function EditVideoControls({ video }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [type, setType] = useState(video.type);
  const [episodeNumber, setEpisodeNumber] = useState(video.episodeNumber ?? '');
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function openEditor() {
    setTitle(video.title);
    setType(video.type);
    setEpisodeNumber(video.episodeNumber ?? '');
    setError(null);
    setOpen(true);
  }

  function save(e) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateVideoAction(video.id, { title, type, episodeNumber });
      if (res?.error) return setError(res.error);
      setOpen(false);
    });
  }

  function remove() {
    if (!window.confirm(`Delete "${video.title}"? This also deletes all its notes and saved documents. This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteVideoAction(video.id);
      if (res?.error) return setError(res.error);
      router.push('/videos');
    });
  }

  return (
    <>
      <div className="flex gap-2 text-sm">
        <button onClick={openEditor} className="px-3 py-1.5 rounded-lg bg-lavender-soft text-ink-soft hover:text-ink">
          Edit
        </button>
        <button onClick={remove} disabled={pending} className="px-3 py-1.5 rounded-lg bg-rose-soft text-ink-soft hover:text-ink">
          Delete
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm flex items-start justify-center pt-24 z-50" onClick={() => setOpen(false)}>
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="bg-paper rounded-3xl shadow-lg p-6 w-full max-w-md space-y-3 border border-lavender-soft"
          >
            <h2 className="font-display text-xl">Edit video</h2>
            {error && <p className="text-sm text-ink bg-rose-soft rounded-lg px-3 py-2">{error}</p>}
            <label className="block text-sm">
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-lavender-soft px-3 py-2" />
            </label>
            <label className="block text-sm">
              Type
              <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-lg border border-lavender-soft px-3 py-2">
                {VIDEO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Episode number (optional)
              <input
                type="number"
                min="1"
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-lavender-soft px-3 py-2"
              />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-ink-soft">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="px-4 py-2 rounded-xl bg-mint text-ink font-semibold text-sm">
                {pending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
