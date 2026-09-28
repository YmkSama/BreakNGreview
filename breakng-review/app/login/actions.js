'use server';

import { redirect } from 'next/navigation';
import { createUser } from '@/lib/queries';
import { setCurrentUser, clearCurrentUser } from '@/lib/auth';

export async function loginAsExisting(formData) {
  const id = parseInt(formData.get('userId'), 10);
  if (!id) return;
  await setCurrentUser(id);
  redirect('/videos');
}

export async function loginAsNew(formData) {
  const name = (formData.get('name') || '').toString().trim();
  if (!name) return;
  const user = await createUser(name);
  await setCurrentUser(user.id);
  redirect('/videos');
}

export async function logoutAction() {
  await clearCurrentUser();
  redirect('/login');
}
