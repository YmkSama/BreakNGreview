import { getCurrentUser } from '@/lib/auth';
import { getUnreadCount } from '@/lib/queries';
import TopNav from '@/components/TopNav';

export default async function MainLayout({ children }) {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadCount(user.id) : 0;

  return (
    <>
      <TopNav user={user} unread={unread} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}
