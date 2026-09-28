const {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} = require('drizzle-orm/pg-core');

// ---------------------------------------------------------------------------
// Users — "individual users" feature. No passwords: teammates pick their
// name from a list. Fine for a small trusted internal team; see README.
// ---------------------------------------------------------------------------
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(), // pastel hex used for avatars/badges
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  nameUnique: uniqueIndex('users_name_unique').on(table.name),
}));

// ---------------------------------------------------------------------------
// Videos — grouped by type (episode / BTS / trailer)
// ---------------------------------------------------------------------------
const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  youtubeId: text('youtube_id').notNull(),
  type: text('type').notNull(), // EPISODE | BTS | TRAILER
  episodeNumber: integer('episode_number'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Notes — timestamped comments, optionally a range (end_timestamp_seconds),
// optionally a reply (parent_id), with tag/status/assignee for task-tracking.
// ---------------------------------------------------------------------------
const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => users.id),
  parentId: integer('parent_id'),
  timestampSeconds: real('timestamp_seconds'),
  endTimestampSeconds: real('end_timestamp_seconds'),
  text: text('text').notNull(),
  tag: text('tag').notNull().default('GENERAL'),
  status: text('status').notNull().default('OPEN'),
  assigneeId: integer('assignee_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Reactions — single thumbs-up toggle per user per note
// ---------------------------------------------------------------------------
const reactions = pgTable('reactions', {
  id: serial('id').primaryKey(),
  noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  noteUserUnique: uniqueIndex('reactions_note_user_unique').on(table.noteId, table.userId),
}));

// ---------------------------------------------------------------------------
// Notifications — @mentions, assignments, replies
// ---------------------------------------------------------------------------
const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId: integer('actor_id').references(() => users.id),
  noteId: integer('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  videoId: integer('video_id').references(() => videos.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // MENTION | ASSIGNED | REPLY
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Documents — a saved, frozen export of a video's notes at a point in time
// ---------------------------------------------------------------------------
const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdBy: integer('created_by').references(() => users.id),
  includedUserIds: integer('included_user_ids').array(),
  snapshot: jsonb('snapshot').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

module.exports = { users, videos, notes, reactions, notifications, documents };
