import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getVideos } from '@/lib/queries';
import VideoTabs from '@/components/VideoTabs';
import AddVideoModal from '@/components/AddVideoModal';

export default async function VideosPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const videos = await getVideos();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl">Videos</h1>
        <AddVideoModal />
      </div>
      <VideoTabs videos={videos} />
    </div>
  );
}
