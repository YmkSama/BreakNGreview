'use server';

import { revalidatePath } from 'next/cache';
import { createVideo } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { parseYoutubeId } from '@/lib/time';

export async function createVideoAction(formData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  const title = (formData.get('title') || '').toString().trim();
  const urlOrId = (formData.get('youtube') || '').toString().trim();
  const type = (formData.get('type') || 'EPISODE').toString();
  const episodeNumberRaw = (formData.get('episodeNumber') || '').toString().trim();
  const episodeNumber = episodeNumberRaw ? parseInt(episodeNumberRaw, 10) : null;

  const youtubeId = parseYoutubeId(urlOrId);
  if (!title) return { error: 'Give the video a title.' };
  if (!youtubeId) return { error: "That doesn't look like a valid YouTube link or ID." };

  await createVideo({ title, youtubeId, type, episodeNumber, createdBy: user.id });
  revalidatePath('/videos');
  return { ok: true };
}
