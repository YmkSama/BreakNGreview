const VIDEO_TYPES = [
  { value: 'EPISODE', label: 'Episodes' },
  { value: 'BTS', label: 'Behind the Scenes' },
  { value: 'TRAILER', label: 'Trailers' },
];

const NOTE_TAGS = [
  { value: 'GENERAL', label: 'General', color: '#E8E3F5', text: '#5B4B8A' },
  { value: 'CUT', label: 'Cut', color: '#FBD8D8', text: '#A14343' },
  { value: 'SOUND_ISSUE', label: 'Sound Issue', color: '#FDE6C8', text: '#9C6B1F' },
  { value: 'GREAT_MOMENT', label: 'Great Moment', color: '#D8F3DC', text: '#3B7A4A' },
  { value: 'FACT_CHECK', label: 'Fact-check', color: '#D6ECF5', text: '#2E6C8A' },
  { value: 'EDIT_NOTE', label: 'Edit Note', color: '#F5E1F0', text: '#8A3E7A' },
];

const NOTE_STATUSES = [
  { value: 'OPEN', label: 'Open', color: '#FDE6C8', text: '#9C6B1F' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#D6ECF5', text: '#2E6C8A' },
  { value: 'RESOLVED', label: 'Resolved', color: '#D8F3DC', text: '#3B7A4A' },
];

const USER_COLORS = [
  '#F5C9C9', '#F7DCA6', '#F6EAA6', '#C9E8B0', '#B6E3D4',
  '#B9D9F2', '#C9C6F0', '#E3C2E8', '#F3C9DE', '#D9C9B0',
];

function tagInfo(value) {
  return NOTE_TAGS.find((t) => t.value === value) || NOTE_TAGS[0];
}
function statusInfo(value) {
  return NOTE_STATUSES.find((s) => s.value === value) || NOTE_STATUSES[0];
}
function videoTypeLabel(value) {
  const t = VIDEO_TYPES.find((v) => v.value === value);
  return t ? t.label : value;
}

module.exports = {
  VIDEO_TYPES,
  NOTE_TAGS,
  NOTE_STATUSES,
  USER_COLORS,
  tagInfo,
  statusInfo,
  videoTypeLabel,
};
