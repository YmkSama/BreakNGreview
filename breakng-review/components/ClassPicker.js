'use client';

import { NOTE_CLASSES } from '@/lib/constants';

// One scrolling row on phones (keeps 44px targets without a tall block), wrapping on wider screens.
export default function ClassPicker({ value, onChange }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible pb-1 sm:pb-0 -mx-1 px-1">
      {NOTE_CLASSES.map((c) => {
        const active = value.includes(c.value);
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => toggle(c.value)}
            aria-pressed={active}
            title={c.label}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs border transition ${
              active ? 'bg-lavender border-lavender text-ink font-medium' : 'bg-white border-lavender-soft text-ink-soft hover:text-ink'
            }`}
          >
            <span aria-hidden="true">{c.emoji}</span> {c.label}
          </button>
        );
      })}
    </div>
  );
}
