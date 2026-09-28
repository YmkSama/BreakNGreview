'use server';

import { revalidatePath } from 'next/cache';
import { markAllNotificationsRead } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';

export async function markAllReadAction() {
  const user = await getCurrentUser();
  if (!user) return;
  await markAllNotificationsRead(user.id);
  revalidatePath('/activity');
  revalidatePath('/videos');
}
