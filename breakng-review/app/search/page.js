import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { searchNotes } from '@/lib/queries';
import { formatRange } from '@/lib/time';
import { tagInfo, classLabels } from '@/lib/constants';

// Wrap each match of the search words in <mark>.
function Highlight({ text, q }) {
  const words = q.split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (words.length === 0) return text;
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'ig'));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-butter rounded px-0.5">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

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
      {q && results.length > 0 && (
        <p className="text-ink-soft text-sm mb-3 tabular">{results.length} note{results.length === 1 ? '' : 's'} matched.</p>
      )}

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
                {n.tag !== 'GENERAL' && (
                  <span className="rounded-full px-2 py-0.5" style={{ background: info.color, color: info.text }}>
                    {info.label}
                  </span>
                )}
                {classLabels(n.classes).map((c) => (
                  <span key={c.value} title={c.label}>{c.emoji}</span>
                ))}
              </div>
              <p className="text-sm"><Highlight text={n.text} q={q} /></p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
