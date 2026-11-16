import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { NOTE_CLASSES, NOTE_TAGS, NOTE_STATUSES } from '@/lib/constants';

export const metadata = { title: 'How to use BreakNG Tables' };

function Section({ title, children }) {
  return (
    <section className="bg-white/70 rounded-2xl p-5 border border-lavender-soft">
      <h2 className="font-display text-lg mb-2">{title}</h2>
      <div className="text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Steps({ items }) {
  return (
    <ol className="list-decimal pl-5 space-y-1">
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  );
}

export default async function InfoPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl">How to use BreakNG Tables</h1>
        <p className="text-ink-soft text-sm mt-1">
          A shared place to watch our videos and leave timestamped notes for the production team.
        </p>
      </div>

      <Section title="1. Getting started">
        <p>
          There are no passwords. Pick your name on the login screen (or add yourself if you&apos;re new). Your notes,
          replies and assignments are tied to that name. Use <strong>switch</strong> at the top right to change user.
        </p>
      </Section>

      <Section title="2. Videos">
        <p>
          The <strong>Videos</strong> tab lists everything, grouped into Episodes, Behind the Scenes and Trailers.
        </p>
        <Steps
          items={[
            <>Click <strong>+ Add video</strong>, give it a title, paste a YouTube link (or ID), choose a type and an optional episode number.</>,
            <>Click a video to open its page: the player is on the left, notes on the right.</>,
            <>Use <strong>Edit</strong> on a video page to change its title, type or episode number.</>,
            <><strong>Delete</strong> removes the video <em>and all its notes and saved documents</em>. It can&apos;t be undone.</>,
          ]}
        />
      </Section>

      <Section title="3. Leaving a note">
        <Steps
          items={[
            <>Pause the video at the moment you want to comment on, then click into the note box (or press <strong>N</strong>). The time is stamped automatically. Use <strong>⏱ re-mark</strong> to change it.</>,
            <>For a stretch of video, tick <strong>range</strong> and click <strong>→ Mark end</strong> at the end point.</>,
            <>Write your note. Type <strong>@name</strong> to mention a teammate. They&apos;ll get a notification.</>,
            <>Pick one or more <strong>departments</strong>. Open <strong>Feedback type &amp; assignee</strong> if you need them. Press <strong>Enter</strong> to post (Shift+Enter adds a new line).</>,
          ]}
        />
        <p>
          Click a note&apos;s timestamp to jump the player to that moment. Use <strong>Reply</strong> to discuss a
          note, and 👍 to agree with one.
        </p>
      </Section>

      <Section title="4. Departments, feedback types and status">
        <p>
          <strong>Departments</strong> say which part of production a note is about. You can pick several, and change
          them later from <strong>Edit</strong> on a note.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_CLASSES.map((c) => (
            <span key={c.value} className="rounded-full bg-lavender-soft px-2 py-0.5 text-xs">
              {c.emoji} {c.label}
            </span>
          ))}
        </div>
        <p>
          Notes with a department get an emoji marker on the strip under the video. Click a marker to jump there. Where markers overlap they merge into one with a count. The small buttons under the strip turn each department on or off, and the purple line is where the video is now.
        </p>
        <p>
          <strong>Feedback types</strong> say what kind of feedback it is (shown on a note only when it isn&apos;t General):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_TAGS.map((t) => (
            <span key={t.value} className="rounded-full px-2 py-0.5 text-xs" style={{ background: t.color, color: t.text }}>
              {t.label}
            </span>
          ))}
        </div>
        <p>
          <strong>Status</strong> tracks the work ({NOTE_STATUSES.map((s) => s.label).join(' → ')}). Tap the circle at
          the start of a note to mark it resolved, or tap again to reopen it. Use <strong>Edit</strong> on a note to
          set In progress, or to change its feedback type, assignee or departments.
        </p>
      </Section>

      <Section title="5. Finding things">
        <ul className="list-disc pl-5 space-y-1">
          <li>Above the notes, switch between All, To do and Done. Open <strong>Filters</strong> to narrow by feedback type, department, author or assignee. Your choices are remembered.</li>
          <li>Tick <strong>Follow playback</strong> to keep the current note in view as the video plays, or press <strong>J</strong> / <strong>K</strong> to jump to the next or previous note. The note at the current time is outlined.</li>
          <li>The search bar at the top searches note text across all videos. Click a result to jump to that moment.</li>
          <li>
            <strong>Activity</strong> shows the latest notes from everyone, plus your notifications (mentions,
            assignments, replies). The badge shows how many are unread.
          </li>
        </ul>
      </Section>

      <Section title="6. Documents">
        <p>
          The <strong>Documents</strong> tab builds a summary of notes to share or print. Choose which videos,
          teammates, departments, feedback types and statuses to include, then copy it as Markdown, download it, or print / save it as a PDF. Department emojis and labels are
          included on each note.
        </p>
      </Section>

      <Section title="Good to know">
        <ul className="list-disc pl-5 space-y-1">
          <li>Everyone on the team can see and edit everything, so double-check before you delete a video.</li>
          <li>Notes are only saved when you post them, so post before switching videos.</li>
        </ul>
      </Section>
    </div>
  );
}
