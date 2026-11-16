import Link from 'next/link';
import { logoutAction } from '@/app/login/actions';
import SearchBox from './SearchBox';

const LINKS = [
  { href: '/videos', label: 'Videos' },
  { href: '/activity', label: 'Activity' },
  { href: '/documents', label: 'Documents' },
  { href: '/info', label: 'Help' },
];

export default function TopNav({ user, unread }) {
  if (!user) return null;

  return (
    <header className="border-b border-lavender-soft bg-white/60 backdrop-blur md:sticky md:top-0 z-40 no-print">
      <div className="max-w-6xl mx-auto px-4 py-2 md:py-3 flex items-center gap-x-4 gap-y-1 flex-wrap">
        <Link href="/videos" className="font-display text-lg text-ink shrink-0 order-1">
          BreakNG Tables
        </Link>

        {/* Phones: logo + user on the first row, links scroll on the second, search last. */}
        <div className="flex items-center gap-2 text-sm shrink-0 order-2 ml-auto md:order-4 md:ml-0">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-ink"
            style={{ background: user.color }}
            aria-hidden="true"
          >
            {user.name[0]?.toUpperCase()}
          </span>
          <span className="text-ink-soft hidden sm:inline">{user.name}</span>
          <form action={logoutAction}>
            <button className="text-ink-soft hover:text-ink underline decoration-dotted text-xs" aria-label={`Switch user (signed in as ${user.name})`}>
              switch
            </button>
          </form>
        </div>

        <nav className="flex items-center gap-1 text-sm order-3 w-full md:w-auto md:order-2 overflow-x-auto" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-full hover:bg-lavender-soft transition inline-flex items-center gap-1 shrink-0"
            >
              {l.label}
              {l.href === '/activity' && unread > 0 && (
                <span className="inline-flex items-center justify-center text-xs font-bold bg-rose text-ink rounded-full min-w-[18px] h-[18px] px-1">
                  {unread}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex-1 min-w-[160px] w-full md:w-auto order-4 md:order-3">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
