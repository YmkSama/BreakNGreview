import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getVideos, getUsers, getAllNotesForDocuments } from '@/lib/queries';
import DocumentBuilder from '@/components/DocumentBuilder';

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [videos, users, notes] = await Promise.all([getVideos(), getUsers(), getAllNotesForDocuments()]);

  return <DocumentBuilder videos={videos} users={users} notes={notes} />;
}
