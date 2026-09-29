import Link from 'next/link';
import { logoutAction } from '@/app/login/actions';
import SearchBox from './SearchBox';

export default function TopNav({ user, unread }) {
  if (!user) return null;

  return (
    <header className="border-b border-lavender-soft bg-white/60 backdrop-blur sticky top-0 z-40 no-print">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <Link href="/videos" className="font-display text-lg text-ink shrink-0">
          BreakNG Tables
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/videos" className="px-3 py-1.5 rounded-full hover:bg-lavender-soft transition">
            Videos
          </Link>
          <Link href="/activity" className="px-3 py-1.5 rounded-full hover:bg-lavender-soft transition inline-flex items-center gap-1">
            Activity
            {unread > 0 && (
              <span className="inline-flex items-center justify-center text-[10px] font-bold bg-rose text-ink rounded-full min-w-[16px] h-4 px-1">
                {unread}
              </span>
            )}
          </Link>
          <Link href="/documents" className="px-3 py-1.5 rounded-full hover:bg-lavender-soft transition">
            Documents
          </Link>
          <Link href="/info" className="px-3 py-1.5 rounded-full hover:bg-lavender-soft transition">
            Info
          </Link>
        </nav>
        <div className="flex-1 min-w-[160px]">
          <SearchBox />
        </div>
        <div className="flex items-center gap-2 text-sm shrink-0">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-ink"
            style={{ background: user.color }}
          >
            {user.name[0]?.toUpperCase()}
          </span>
          <span className="text-ink-soft">{user.name}</span>
          <form action={logoutAction}>
            <button className="text-ink-soft hover:text-ink underline decoration-dotted text-xs">switch</button>
          </form>
        </div>
      </div>
    </header>
  );
}
