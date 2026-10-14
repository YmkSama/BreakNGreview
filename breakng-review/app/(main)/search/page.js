import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { searchNotes } from '@/lib/queries';
import { formatRange } from '@/lib/time';
import { tagInfo, classLabels } from '@/lib/constants';

export default async function SearchPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sp = (await searchParams) || {};
  const q = (sp.q || '').toString();
  const results = q ? await searchNotes(q) : [];

  return (
    <div>
      <h1 className="font-display text-2xl mb-4">
        Search {q && <span className="text-ink-soft text-base font-sans">— &quot;{q}&quot;</span>}
      </h1>

      {!q && <p className="text-ink-soft text-sm">Type something in the search bar above.</p>}
      {q && results.length === 0 && <p className="text-ink-soft text-sm italic">No notes matched.</p>}

      <div className="space-y-3">
        {results.map((n) => {
          const info = tagInfo(n.tag);
          return (
            <Link
              key={n.id}
              href={`/videos/${n.videoId}?t=${n.timestampSeconds || 0}`}
              className="block bg-white/70 rounded-2xl p-4 border border-lavender-soft hover:shadow-sm transition"
            >
              <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
                <span className="font-medium">{n.author?.name}</span>
                <span className="text-ink-soft">on {n.video?.title}</span>
                {n.timestampSeconds != null && (
                  <span className="font-mono bg-sky-soft rounded-full px-2 py-0.5">
                    {formatRange(n.timestampSeconds, n.endTimestampSeconds)}
                  </span>
                )}
                <span className="rounded-full px-2 py-0.5" style={{ background: info.color, color: info.text }}>
                  {info.label}
                </span>
                {classLabels(n.classes).map((c) => (
                  <span key={c.value} title={c.label}>{c.emoji}</span>
                ))}
              </div>
              <p className="text-sm">{n.text}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
