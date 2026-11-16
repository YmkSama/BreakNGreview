'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateVideoAction, deleteVideoAction } from '@/app/videos/actions';
import { VIDEO_TYPES } from '@/lib/constants';

export default function EditVideoControls({ video }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [type, setType] = useState(video.type);
  const [episodeNumber, setEpisodeNumber] = useState(video.episodeNumber ?? '');
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef(null);

  // Escape closes the dialog or the menu; a click outside closes the menu.
  useEffect(() => {
    if (!open && !menu) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      setMenu(false);
    };
    const onDown = (e) => {
      if (menu && menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, menu]);

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
    setMenu(false);
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
        <button onClick={openEditor} aria-label="Edit video" className="px-3 py-1.5 rounded-lg bg-lavender-soft text-ink-soft hover:text-ink">
          Edit video
        </button>

        {/* Delete lives in an overflow menu so a stray tap can't land on it. */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenu((m) => !m)}
            aria-haspopup="menu"
            aria-expanded={menu}
            aria-label="More video actions"
            className="px-3 py-1.5 rounded-lg bg-lavender-soft text-ink-soft hover:text-ink"
          >
            <span aria-hidden="true">⋯</span>
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 mt-1 z-40 min-w-[11rem] rounded-xl border border-lavender-soft bg-paper shadow-lg p-1">
              <button
                role="menuitem"
                onClick={remove}
                disabled={pending}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#8F3A3A] hover:bg-rose-soft"
              >
                Delete this video…
              </button>
            </div>
          )}
        </div>
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
