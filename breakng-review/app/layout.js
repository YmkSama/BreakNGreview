import './globals.css';
import { getCurrentUser } from '@/lib/auth';
import { getUnreadCount } from '@/lib/queries';
import TopNav from '@/components/TopNav';

export const metadata = {
  title: 'BreakNG Tables — Production Review',
  description: 'Timestamped video review for the BreakNG Tables production team',
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadCount(user.id) : 0;

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TopNav user={user} unread={unread} />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
