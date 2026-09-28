import Link from 'next/link';

export default function VideoCard({ video }) {
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
      </div>
    </Link>
  );
}
