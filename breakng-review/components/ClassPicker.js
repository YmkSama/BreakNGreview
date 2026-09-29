'use client';

import { NOTE_CLASSES } from '@/lib/constants';

export default function ClassPicker({ value, onChange }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {NOTE_CLASSES.map((c) => {
        const active = value.includes(c.value);
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => toggle(c.value)}
            aria-pressed={active}
            title={c.label}
            className={`px-2 py-1 rounded-full text-xs border transition ${
              active ? 'bg-lavender border-lavender text-ink font-medium' : 'bg-white border-lavender-soft text-ink-soft hover:text-ink'
            }`}
          >
            {c.emoji} {c.label}
          </button>
        );
      })}
    </div>
  );
}
