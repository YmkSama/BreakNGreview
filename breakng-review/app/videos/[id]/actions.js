'use server';

import { revalidatePath } from 'next/cache';
import { createNote, updateNote, toggleReaction } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';

export async function createNoteAction(payload) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  const { videoId, parentId, timestampSeconds, endTimestampSeconds, text, tag, status, assigneeId } = payload;
  if (!text || !text.trim()) return { error: 'Note text is required.' };

  await createNote({
    videoId,
    authorId: user.id,
    parentId: parentId || null,
    timestampSeconds: timestampSeconds ?? null,
    endTimestampSeconds: endTimestampSeconds ?? null,
    text: text.trim(),
    tag: tag || 'GENERAL',
    status: status || 'OPEN',
    assigneeId: assigneeId || null,
  });

  revalidatePath(`/videos/${videoId}`);
  revalidatePath('/activity');
  revalidatePath('/documents');
  return { ok: true };
}

export async function updateNoteFieldAction(noteId, videoId, field, value) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  const allowed = ['tag', 'status', 'assigneeId'];
  if (!allowed.includes(field)) return { error: 'Not allowed' };

  await updateNote(noteId, { [field]: value, actorId: user.id });
  revalidatePath(`/videos/${videoId}`);
  revalidatePath('/activity');
  return { ok: true };
}

export async function toggleReactionAction(noteId, videoId) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  await toggleReaction(noteId, user.id);
  revalidatePath(`/videos/${videoId}`);
  return { ok: true };
}
