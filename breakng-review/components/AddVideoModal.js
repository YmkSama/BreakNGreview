'use client';

import { useActionState, useState } from 'react';
import { createVideoAction } from '@/app/videos/actions';
import { VIDEO_TYPES } from '@/lib/constants';

const initialState = { error: null, ok: false };

export default function AddVideoModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prevState, formData) => {
    const res = await createVideoAction(formData);
    if (res?.ok) setOpen(false);
    return res || initialState;
  }, initialState);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-mint text-ink font-semibold text-sm shadow-sm hover:brightness-95 transition"
      >
        + Add video
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-ink/20 backdrop-blur-sm flex items-start justify-center pt-24 z-50"
          onClick={() => setOpen(false)}
        >
          <form
            action={formAction}
            onClick={(e) => e.stopPropagation()}
            className="bg-paper rounded-3xl shadow-lg p-6 w-full max-w-md space-y-3 border border-lavender-soft"
          >
            <h2 className="font-display text-xl">Add a video</h2>

            {state?.error && (
              <p className="text-sm text-ink bg-rose-soft rounded-lg px-3 py-2">{state.error}</p>
            )}

            <div>
              <label className="text-xs uppercase tracking-wide text-ink-soft">Title</label>
              <input
                name="title"
                required
                className="w-full rounded-xl border border-lavender-soft px-3 py-2 text-sm mt-1"
                placeholder="e.g. Episode 4: The Market at Dusk"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-ink-soft">YouTube link or ID</label>
              <input
                name="youtube"
                required
                className="w-full rounded-xl border border-lavender-soft px-3 py-2 text-sm mt-1"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs uppercase tracking-wide text-ink-soft">Type</label>
                <select name="type" className="w-full rounded-xl border border-lavender-soft px-3 py-2 text-sm mt-1">
                  {VIDEO_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase tracking-wide text-ink-soft">Episode #</label>
                <input
                  name="episodeNumber"
                  type="number"
                  className="w-full rounded-xl border border-lavender-soft px-3 py-2 text-sm mt-1"
                  placeholder="optional"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-ink-soft">
                Cancel
              </button>
              <button disabled={pending} className="px-4 py-2 rounded-xl bg-lavender text-ink font-semibold text-sm disabled:opacity-60">
                {pending ? 'Adding…' : 'Add video'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
