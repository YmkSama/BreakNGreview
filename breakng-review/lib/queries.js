const { eq, and, desc, asc, inArray } = require('drizzle-orm');
const { db, users, videos, notes, reactions, notifications } = require('@/db');
const { findMentions } = require('./mentions');
const { USER_COLORS } = require('./constants');

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
async function getUsers() {
  return db.select().from(users).orderBy(asc(users.name));
}

async function getUserByName(name) {
  const rows = await db.select().from(users).where(eq(users.name, name)).limit(1);
  return rows[0] || null;
}

async function createUser(name) {
  const existing = await getUserByName(name);
  if (existing) return existing;
  const count = (await getUsers()).length;
  const color = USER_COLORS[count % USER_COLORS.length];
  const rows = await db.insert(users).values({ name, color }).returning();
  return rows[0];
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------
async function getVideos() {
  return db.select().from(videos).orderBy(desc(videos.createdAt));
}

async function getVideoById(id) {
  const rows = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return rows[0] || null;
}

async function createVideo({ title, youtubeId, type, episodeNumber, createdBy }) {
  const rows = await db
    .insert(videos)
    .values({ title, youtubeId, type, episodeNumber: episodeNumber || null, createdBy })
    .returning();
  return rows[0];
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
async function notify({ userId, actorId, noteId, videoId, type }) {
  if (!userId || userId === actorId) return;
  await db.insert(notifications).values({ userId, actorId, noteId, videoId, type });
}

async function getNotificationsForUser(userId) {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  return rows;
}

async function getUnreadCount(userId) {
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return rows.length;
}

async function markAllNotificationsRead(userId) {
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
}

// ---------------------------------------------------------------------------
// Notes (comments) — flat fetch + assembled into a tree in JS
// ---------------------------------------------------------------------------
async function getNotesForVideo(videoId, currentUserId) {
  const flatNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.videoId, videoId))
    .orderBy(asc(notes.timestampSeconds), asc(notes.createdAt));

  if (flatNotes.length === 0) return [];

  const noteIds = flatNotes.map((n) => n.id);
  const allReactions = await db.select().from(reactions).where(inArray(reactions.noteId, noteIds));
  const allUsers = await getUsers();
  const userById = Object.fromEntries(allUsers.map((u) => [u.id, u]));

  const reactionsByNote = {};
  for (const r of allReactions) {
    if (!reactionsByNote[r.noteId]) reactionsByNote[r.noteId] = [];
    reactionsByNote[r.noteId].push(r);
  }

  const byId = {};
  for (const n of flatNotes) {
    byId[n.id] = {
      ...n,
      author: userById[n.authorId] || null,
      assignee: n.assigneeId ? userById[n.assigneeId] || null : null,
      reactionCount: (reactionsByNote[n.id] || []).length,
      reactedByMe: (reactionsByNote[n.id] || []).some((r) => r.userId === currentUserId),
      replies: [],
    };
  }

  const roots = [];
  for (const n of flatNotes) {
    if (n.parentId && byId[n.parentId]) {
      byId[n.parentId].replies.push(byId[n.id]);
    } else if (!n.parentId) {
      roots.push(byId[n.id]);
    }
  }
  return roots;
}

async function createNote({ videoId, authorId, parentId, timestampSeconds, endTimestampSeconds, text, tag, status, assigneeId }) {
  const rows = await db
    .insert(notes)
    .values({
      videoId,
      authorId,
      parentId: parentId || null,
      timestampSeconds: timestampSeconds ?? null,
      endTimestampSeconds: endTimestampSeconds ?? null,
      text,
      tag: tag || 'GENERAL',
      status: status || 'OPEN',
      assigneeId: assigneeId || null,
    })
    .returning();
  const note = rows[0];

  const allUsers = await getUsers();

  // Reply notification
  if (parentId) {
    const parentRows = await db.select().from(notes).where(eq(notes.id, parentId)).limit(1);
    const parent = parentRows[0];
    if (parent) {
      await notify({ userId: parent.authorId, actorId: authorId, noteId: note.id, videoId, type: 'REPLY' });
    }
  }

  // Assignment notification
  if (assigneeId) {
    await notify({ userId: assigneeId, actorId: authorId, noteId: note.id, videoId, type: 'ASSIGNED' });
  }

  // Mention notifications
  const mentioned = findMentions(text, allUsers);
  for (const u of mentioned) {
    await notify({ userId: u.id, actorId: authorId, noteId: note.id, videoId, type: 'MENTION' });
  }

  return note;
}

async function updateNote(noteId, fields) {
  const rows = await db
    .update(notes)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(notes.id, noteId))
    .returning();
  const updated = rows[0];

  if (fields.assigneeId && updated) {
    await notify({
      userId: fields.assigneeId,
      actorId: fields.actorId,
      noteId: updated.id,
      videoId: updated.videoId,
      type: 'ASSIGNED',
    });
  }
  return updated;
}

async function toggleReaction(noteId, userId) {
  const existing = await db
    .select()
    .from(reactions)
    .where(and(eq(reactions.noteId, noteId), eq(reactions.userId, userId)))
    .limit(1);
  if (existing[0]) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
    return false;
  }
  await db.insert(reactions).values({ noteId, userId });
  return true;
}

// ---------------------------------------------------------------------------
// Cross-video search
// ---------------------------------------------------------------------------
async function searchNotes(query) {
  if (!query || !query.trim()) return [];
  const all = await db.select().from(notes).orderBy(desc(notes.createdAt));
  const lower = query.toLowerCase();
  const matches = all.filter((n) => n.text.toLowerCase().includes(lower));
  const allVideos = await getVideos();
  const videoById = Object.fromEntries(allVideos.map((v) => [v.id, v]));
  const allUsers = await getUsers();
  const userById = Object.fromEntries(allUsers.map((u) => [u.id, u]));
  return matches.map((n) => ({ ...n, video: videoById[n.videoId], author: userById[n.authorId] }));
}

// ---------------------------------------------------------------------------
// Activity feed — recent top-level notes and replies across all videos
// ---------------------------------------------------------------------------
async function getRecentActivity(limit = 50) {
  const all = await db.select().from(notes).orderBy(desc(notes.createdAt)).limit(limit);
  const allVideos = await getVideos();
  const videoById = Object.fromEntries(allVideos.map((v) => [v.id, v]));
  const allUsers = await getUsers();
  const userById = Object.fromEntries(allUsers.map((u) => [u.id, u]));
  return all.map((n) => ({ ...n, video: videoById[n.videoId], author: userById[n.authorId] }));
}

// ---------------------------------------------------------------------------
// Full note tree across every video — used by the Documents builder
// ---------------------------------------------------------------------------
async function getAllNotesForDocuments() {
  const allNotes = await db
    .select()
    .from(notes)
    .orderBy(asc(notes.videoId), asc(notes.timestampSeconds), asc(notes.createdAt));
  const allUsers = await getUsers();
  const allVideos = await getVideos();
  const userById = Object.fromEntries(allUsers.map((u) => [u.id, u]));
  const videoById = Object.fromEntries(allVideos.map((v) => [v.id, v]));

  const byId = {};
  for (const n of allNotes) {
    byId[n.id] = {
      ...n,
      author: userById[n.authorId] || null,
      assignee: n.assigneeId ? userById[n.assigneeId] || null : null,
      video: videoById[n.videoId] || null,
      replies: [],
    };
  }
  const roots = [];
  for (const n of allNotes) {
    if (n.parentId && byId[n.parentId]) byId[n.parentId].replies.push(byId[n.id]);
    else if (!n.parentId) roots.push(byId[n.id]);
  }
  return roots;
}

module.exports = {
  getUsers,
  getUserByName,
  createUser,
  getVideos,
  getVideoById,
  createVideo,
  getNotificationsForUser,
  getUnreadCount,
  markAllNotificationsRead,
  getNotesForVideo,
  createNote,
  updateNote,
  toggleReaction,
  searchNotes,
  getRecentActivity,
  getAllNotesForDocuments,
};
