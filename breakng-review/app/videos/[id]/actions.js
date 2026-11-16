'use server';

import { revalidatePath } from 'next/cache';
import { createNote, createNotesBulk, updateNote, editNoteText, deleteNote, toggleReaction } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { NOTE_CLASSES } from '@/lib/constants';

function cleanClasses(values) {
  const valid = new Set(NOTE_CLASSES.map((c) => c.value));
  return [...new Set((Array.isArray(values) ? values : []).filter((v) => valid.has(v)))];
}

export async function createNoteAction(payload) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  const { videoId, parentId, timestampSeconds, endTimestampSeconds, text, tag, classes, status, assigneeId } = payload;
  if (!text || !text.trim()) return { error: 'Note text is required.' };

  await createNote({
    videoId,
    authorId: user.id,
    parentId: parentId || null,
    timestampSeconds: timestampSeconds ?? null,
    endTimestampSeconds: endTimestampSeconds ?? null,
    text: text.trim(),
    tag: tag || 'GENERAL',
    classes: parentId ? [] : cleanClasses(classes),
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

  const allowed = ['tag', 'classes', 'status', 'assigneeId'];
  if (!allowed.includes(field)) return { error: 'Not allowed' };

  if (field === 'classes') value = cleanClasses(value);
  await updateNote(noteId, { [field]: value, actorId: user.id });
  revalidatePath(`/videos/${videoId}`);
  revalidatePath('/activity');
  return { ok: true };
}

export async function editNoteTextAction(noteId, videoId, text) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };
  const clean = (text || '').toString().trim().slice(0, 5000);
  if (!clean) return { error: 'A note cannot be empty. Delete it instead.' };

  await editNoteText(noteId, clean, user.id);
  revalidatePath(`/videos/${videoId}`);
  revalidatePath('/activity');
  revalidatePath('/documents');
  return { ok: true };
}

export async function deleteNoteAction(noteId, videoId) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  await deleteNote(noteId);
  revalidatePath(`/videos/${videoId}`);
  revalidatePath('/videos');
  revalidatePath('/activity');
  revalidatePath('/documents');
  return { ok: true };
}

export async function toggleReactionAction(noteId, videoId) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  await toggleReaction(noteId, user.id);
  revalidatePath(`/videos/${videoId}`);
  return { ok: true };
}

export async function importMarkersAction(videoId, items) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };
  if (!Array.isArray(items) || items.length === 0) return { error: 'Nothing to import.' };
  if (items.length > 500) return { error: 'Import at most 500 markers at a time.' };

  const clean = [];
  for (const i of items) {
    const text = (i?.text || '').toString().trim().slice(0, 5000);
    const t = Number(i?.timestampSeconds);
    if (!text || !Number.isFinite(t) || t < 0) continue;
    const end = Number(i?.endTimestampSeconds);
    clean.push({
      text,
      timestampSeconds: t,
      endTimestampSeconds: Number.isFinite(end) && end > t ? end : null,
      classes: cleanClasses(i?.classes),
    });
  }
  if (clean.length === 0) return { error: 'No valid markers to import.' };

  const result = await createNotesBulk({ videoId, authorId: user.id, items: clean });
  revalidatePath(`/videos/${videoId}`);
  revalidatePath('/activity');
  revalidatePath('/documents');
  return { ok: true, ...result };
}
