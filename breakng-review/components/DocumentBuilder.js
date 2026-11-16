'use client';

import { useMemo, useState } from 'react';
import { NOTE_TAGS, NOTE_STATUSES, NOTE_CLASSES, tagInfo, statusInfo, classLabels, videoTypeLabel } from '@/lib/constants';
import { formatRange } from '@/lib/time';

function buildMarkdown(groups) {
  const lines = ['# BreakNG Tables: Production Notes', `_Generated ${new Date().toLocaleString()}_`, ''];
  for (const group of groups) {
    lines.push(`## ${group.video.episodeNumber ? `#${group.video.episodeNumber}: ` : ''}${group.video.title} (${videoTypeLabel(group.video.type)})`);
    if (group.notes.length === 0) {
      lines.push('_No notes match the current filters._', '');
      continue;
    }
    for (const n of group.notes) {
      const time = n.timestampSeconds != null ? `[${formatRange(n.timestampSeconds, n.endTimestampSeconds)}] ` : '';
      const classText = classLabels(n.classes).map((c) => `${c.emoji} ${c.label}`).join(', ');
      const meta = [
        n.tag !== 'GENERAL' ? tagInfo(n.tag).label : null,
        classText || null,
        statusInfo(n.status).label,
        n.assignee ? `assigned: ${n.assignee.name}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      lines.push(`- **${time}${n.author?.name || 'Unknown'}** _(${meta})_ — ${n.text}`);
      for (const r of n.replies) {
        lines.push(`  - ↳ **${r.author?.name || 'Unknown'}**: ${r.text}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

// A note passes if it has no department (and "No department" is on) or any of its departments is on.
function matchesDepartment(n, classSet) {
  const cls = n.classes || [];
  if (cls.length === 0) return classSet.has('NONE');
  return cls.some((c) => classSet.has(c));
}

function FilterGroup({ title, items, selected, onToggle }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const active = selected.has(item.value);
          return (
            <button
              key={item.value}
              onClick={() => onToggle(item.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                active ? 'bg-lavender text-ink' : 'bg-white/60 text-ink-soft line-through'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DocumentBuilder({ videos, users, notes }) {
  const [videoIds, setVideoIds] = useState(() => new Set(videos.map((v) => v.id)));
  const [userIds, setUserIds] = useState(() => new Set(users.map((u) => u.id)));
  const [tags, setTags] = useState(() => new Set(NOTE_TAGS.map((t) => t.value)));
  const [classSet, setClassSet] = useState(() => new Set([...NOTE_CLASSES.map((c) => c.value), 'NONE']));
  const [showFilters, setShowFilters] = useState(false);
  const [statuses, setStatuses] = useState(() => new Set(NOTE_STATUSES.map((s) => s.value)));

  const toggle = (set, setter, value) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const groups = useMemo(() => {
    return videos
      .filter((v) => videoIds.has(v.id))
      .map((video) => {
        const videoNotes = notes
          .filter((n) => n.videoId === video.id)
          .filter((n) => userIds.has(n.authorId) && tags.has(n.tag) && statuses.has(n.status) && matchesDepartment(n, classSet))
          .map((n) => ({ ...n, replies: n.replies.filter((r) => userIds.has(r.authorId)) }));
        return { video, notes: videoNotes };
      });
  }, [videos, notes, videoIds, userIds, tags, statuses, classSet]);

  const markdown = useMemo(() => buildMarkdown(groups), [groups]);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (e) {
      /* clipboard may be unavailable; the download/print buttons still work */
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breakng-production-notes.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="font-display text-2xl mb-3 no-print">Documents</h1>

      <div className="flex gap-2 mb-4 no-print flex-wrap items-center">
        <button onClick={copyMarkdown} className="px-3 py-1.5 rounded-lg bg-lavender text-ink text-sm font-medium">Copy as Markdown</button>
        <button onClick={downloadMarkdown} className="px-3 py-1.5 rounded-lg bg-mint text-ink text-sm font-medium">Download .md</button>
        <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg bg-peach text-ink text-sm font-medium">Print / Save as PDF</button>
        <button
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className="lg:hidden px-3 py-1.5 rounded-lg bg-white/70 border border-lavender-soft text-sm text-ink-soft"
        >
          {showFilters ? 'Hide filters' : 'Choose what to include'}
        </button>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-5 no-print`}>
          <FilterGroup title="Videos" items={videos.map((v) => ({ value: v.id, label: v.title }))} selected={videoIds} onToggle={(v) => toggle(videoIds, setVideoIds, v)} />
          <FilterGroup title="Team members" items={users.map((u) => ({ value: u.id, label: u.name }))} selected={userIds} onToggle={(v) => toggle(userIds, setUserIds, v)} />
          <FilterGroup title="Departments" items={[...NOTE_CLASSES.map((c) => ({ value: c.value, label: `${c.emoji} ${c.label}` })), { value: 'NONE', label: 'No department' }]} selected={classSet} onToggle={(v) => toggle(classSet, setClassSet, v)} />
          <FilterGroup title="Feedback types" items={NOTE_TAGS.map((t) => ({ value: t.value, label: t.label }))} selected={tags} onToggle={(v) => toggle(tags, setTags, v)} />
          <FilterGroup title="Status" items={NOTE_STATUSES.map((s) => ({ value: s.value, label: s.label }))} selected={statuses} onToggle={(v) => toggle(statuses, setStatuses, v)} />
          <p className="text-xs text-ink-soft">Untoggle a video, teammate, department, feedback type, or status to leave their notes out of the document.</p>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-lavender-soft p-6 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-[75vh] overflow-y-auto">
            {markdown}
          </div>
        </div>
      </div>
    </div>
  );
}
