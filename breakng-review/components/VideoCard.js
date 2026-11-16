import Link from 'next/link';

export default function VideoCard({ video, stats }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="block bg-white/70 rounded-2xl overflow-hidden border border-lavender-soft hover:shadow-md transition"
    >
      <div className="aspect-video bg-ink/5 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <p className="font-medium text-sm line-clamp-2">
          {video.episodeNumber ? `#${video.episodeNumber} — ` : ''}
          {video.title}
        </p>
        <p className="mt-1 text-xs text-ink-soft tabular">
          {!stats || stats.total === 0
            ? 'No notes yet'
            : stats.open === 0
              ? `All ${stats.total} notes resolved ✓`
              : `${stats.open} to do · ${stats.total - stats.open} resolved`}
        </p>
      </div>
    </Link>
  );
}
