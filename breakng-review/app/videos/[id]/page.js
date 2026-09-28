import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getVideoById, getNotesForVideo, getUsers } from '@/lib/queries';
import VideoWorkspace from '@/components/VideoWorkspace';

export default async function VideoPage({ params, searchParams }) {
  const { id } = await params;
  const sp = (await searchParams) || {};
  const videoId = parseInt(id, 10);

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const video = await getVideoById(videoId);
  if (!video) notFound();

  const [notes, users] = await Promise.all([getNotesForVideo(videoId, user.id), getUsers()]);
  const initialSeek = sp.t ? parseFloat(sp.t) : null;

  return <VideoWorkspace video={video} initialNotes={notes} users={users} initialSeek={initialSeek} />;
}
