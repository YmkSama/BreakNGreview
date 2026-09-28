// Finds @Name mentions in note text against a known list of users.
// Matches longest names first so "@Yimika Owoaje" doesn't get shadowed by a
// shorter "@Yimika" match. Good enough for a small trusted team; not a full
// tokenizer.
function findMentions(text, users) {
  if (!text) return [];
  const sorted = [...users].sort((a, b) => b.name.length - a.name.length);
  const lowerText = text.toLowerCase();
  const found = [];
  const claimed = new Array(text.length).fill(false);

  for (const user of sorted) {
    const needle = `@${user.name}`.toLowerCase();
    let fromIndex = 0;
    while (true) {
      const idx = lowerText.indexOf(needle, fromIndex);
      if (idx === -1) break;
      const alreadyClaimed = claimed.slice(idx, idx + needle.length).some(Boolean);
      if (!alreadyClaimed) {
        for (let i = idx; i < idx + needle.length; i++) claimed[i] = true;
        if (!found.find((u) => u.id === user.id)) found.push(user);
      }
      fromIndex = idx + needle.length;
    }
  }
  return found;
}

// Splits text into plain segments and mention segments for rendering.
function splitMentionSegments(text, users) {
  const mentioned = findMentions(text, users);
  if (mentioned.length === 0) return [{ type: 'text', value: text }];

  const names = mentioned.map((u) => `@${u.name}`).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');

  const segments = [];
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    segments.push({ type: 'mention', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ type: 'text', value: text.slice(lastIndex) });
  return segments;
}

module.exports = { findMentions, splitMentionSegments };
