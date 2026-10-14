'use server';

import { revalidatePath } from 'next/cache';
import { createVideo, updateVideo, deleteVideo } from '@/lib/queries';
import { VIDEO_TYPES } from '@/lib/constants';
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

export async function updateVideoAction(videoId, { title, type, episodeNumber }) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  const cleanTitle = (title || '').toString().trim();
  if (!cleanTitle) return { error: 'Title cannot be empty.' };
  if (!VIDEO_TYPES.some((t) => t.value === type)) return { error: 'Invalid video type.' };
  const num = episodeNumber ? parseInt(episodeNumber, 10) : null;
  if (episodeNumber && (!num || num < 1)) return { error: 'Episode number must be a positive number.' };

  await updateVideo(videoId, { title: cleanTitle, type, episodeNumber: num });
  revalidatePath(`/videos/${videoId}`);
  revalidatePath('/videos');
  revalidatePath('/activity');
  revalidatePath('/documents');
  return { ok: true };
}

export async function deleteVideoAction(videoId) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  await deleteVideo(videoId);
  revalidatePath('/videos');
  revalidatePath('/activity');
  revalidatePath('/documents');
  return { ok: true };
}
