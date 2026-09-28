export default function SearchBox() {
  return (
    <form action="/search" method="GET" className="flex">
      <input
        name="q"
        placeholder="Search all notes…"
        className="w-full rounded-full border border-lavender-soft px-3 py-1.5 text-sm bg-white/70 focus:bg-white outline-none"
      />
    </form>
  );
}
