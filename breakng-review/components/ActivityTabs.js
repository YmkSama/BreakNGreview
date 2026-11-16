'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRange, formatRelative } from '@/lib/time';
import { tagInfo, classLabels } from '@/lib/constants';
import { markAllReadAction } from '@/app/activity/actions';

const NOTIF_LABEL = {
  MENTION: 'mentioned you',
  ASSIGNED: 'assigned you a note',
  REPLY: 'replied to your note',
};

// Runs of three or more notes by one person on one video, posted close together (a marker import,
// say), collapse into a single row so one import does not flood the feed.
function groupActivity(items) {
  const groups = [];
  for (const n of items) {
    const g = groups[groups.length - 1];
    const last = g && g.items[g.items.length - 1];
    if (last && last.authorId === n.authorId && last.videoId === n.videoId && Math.abs(new Date(last.createdAt) - new Date(n.createdAt)) < 15 * 60 * 1000) {
      g.items.push(n);
    } else {
      groups.push({ items: [n] });
    }
  }
  return groups;
}

function ActivityRow({ n, compact }) {
  const info = tagInfo(n.tag);
  return (
    <Link
      href={`/videos/${n.videoId}?t=${n.timestampSeconds || 0}`}
      className={`block rounded-2xl border border-lavender-soft hover:shadow-sm transition ${compact ? 'bg-white/60 px-3 py-2' : 'bg-white/70 p-4'}`}
    >
      <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
        {!compact && <span className="font-medium">{n.author?.name}</span>}
        {!compact && <span className="text-ink-soft">on {n.video?.title}</span>}
        {!compact && <span className="text-ink-soft tabular">{formatRelative(n.createdAt)}</span>}
        {n.timestampSeconds != null && (
          <span className="font-mono bg-sky-soft rounded-full px-2 py-0.5">{formatRange(n.timestampSeconds, n.endTimestampSeconds)}</span>
        )}
        {!n.parentId && n.tag !== 'GENERAL' && (
          <span className="rounded-full px-2 py-0.5" style={{ background: info.color, color: info.text }}>{info.label}</span>
        )}
        {classLabels(n.classes).map((c) => (
          <span key={c.value} title={c.label}>{c.emoji}</span>
        ))}
      </div>
      <p className="text-sm line-clamp-2">{n.text}</p>
    </Link>
  );
}

export default function ActivityTabs({ activity, notifications }) {
  const [tab, setTab] = useState('ALL');
  const router = useRouter();
  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async () => {
    await markAllReadAction();
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h1 className="font-display text-2xl">Activity</h1>
        {tab === 'MINE' && unread > 0 && (
          <button onClick={markRead} className="text-xs text-ink-soft underline decoration-dotted">
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('ALL')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${tab === 'ALL' ? 'bg-lavender text-ink' : 'bg-white/60 text-ink-soft'}`}
        >
          All activity
        </button>
        <button
          onClick={() => setTab('MINE')}
          className={`px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-1.5 ${
            tab === 'MINE' ? 'bg-lavender text-ink' : 'bg-white/60 text-ink-soft'
          }`}
        >
          For you
          {unread > 0 && (
            <span className="inline-flex items-center justify-center text-xs font-bold bg-rose text-ink rounded-full min-w-[18px] h-[18px] px-1">
              {unread}
            </span>
          )}
        </button>
      </div>

      {tab === 'ALL' ? (
        <div className="space-y-3">
          {activity.length === 0 && <p className="text-ink-soft text-sm italic">Nothing yet.</p>}
          {groupActivity(activity).map((g) =>
            g.items.length >= 3 ? (
              <details key={g.items[0].id} className="bg-white/70 rounded-2xl border border-lavender-soft">
                <summary className="cursor-pointer list-none p-4 text-sm flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{g.items[0].author?.name}</span>
                  <span>added {g.items.length} notes to</span>
                  <span className="font-medium">{g.items[0].video?.title}</span>
                  <span className="text-ink-soft tabular text-xs">{formatRelative(g.items[0].createdAt)}</span>
                  <span className="ml-auto text-xs text-ink-soft underline decoration-dotted">Show them</span>
                </summary>
                <div className="space-y-2 p-3 pt-0">
                  {g.items.map((n) => (
                    <ActivityRow key={n.id} n={n} compact />
                  ))}
                </div>
              </details>
            ) : (
              g.items.map((n) => <ActivityRow key={n.id} n={n} />)
            )
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.length === 0 && <p className="text-ink-soft text-sm italic">Nothing here yet.</p>}
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.videoId ? `/videos/${n.videoId}` : '#'}
              className={`block rounded-2xl p-4 border transition hover:shadow-sm ${
                n.read ? 'bg-white/50 border-lavender-soft' : 'bg-butter/40 border-butter'
              }`}
            >
              <p className="text-sm">
                <span className="font-medium">{n.actor?.name || 'Someone'}</span> {NOTIF_LABEL[n.type] || 'notified you'}
                {n.video && <span className="text-ink-soft"> on {n.video.title}</span>}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
