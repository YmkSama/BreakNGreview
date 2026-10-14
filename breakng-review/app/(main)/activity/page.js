import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getRecentActivity, getNotificationsForUser, getUsers, getVideos } from '@/lib/queries';
import ActivityTabs from '@/components/ActivityTabs';

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [activity, notifications, users, videos] = await Promise.all([
    getRecentActivity(),
    getNotificationsForUser(user.id),
    getUsers(),
    getVideos(),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  const videoById = Object.fromEntries(videos.map((v) => [v.id, v]));

  const enrichedNotifications = notifications.map((n) => ({
    ...n,
    actor: n.actorId ? userById[n.actorId] : null,
    video: n.videoId ? videoById[n.videoId] : null,
  }));

  return <ActivityTabs activity={activity} notifications={enrichedNotifications} />;
}
