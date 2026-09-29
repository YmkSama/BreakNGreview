'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRange } from '@/lib/time';
import { tagInfo, classLabels } from '@/lib/constants';
import { markAllReadAction } from '@/app/activity/actions';

const NOTIF_LABEL = {
  MENTION: 'mentioned you',
  ASSIGNED: 'assigned you a note',
  REPLY: 'replied to your note',
};

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
            <span className="inline-flex items-center justify-center text-[10px] font-bold bg-rose text-ink rounded-full min-w-[16px] h-4 px-1">
              {unread}
            </span>
          )}
        </button>
      </div>

      {tab === 'ALL' ? (
        <div className="space-y-3">
          {activity.length === 0 && <p className="text-ink-soft text-sm italic">Nothing yet.</p>}
          {activity.map((n) => {
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
                  {!n.parentId && (
                    <span className="rounded-full px-2 py-0.5" style={{ background: info.color, color: info.text }}>
                      {info.label}
                    </span>
                  )}
                  {classLabels(n.classes).map((c) => (
                    <span key={c.value} title={c.label}>{c.emoji}</span>
                  ))}
                </div>
                <p className="text-sm line-clamp-2">{n.text}</p>
              </Link>
            );
          })}
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
