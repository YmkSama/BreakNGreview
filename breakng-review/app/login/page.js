import { getUsers } from '@/lib/queries';
import { loginAsExisting, loginAsNew } from './actions';

export default async function LoginPage() {
  const users = await getUsers();

  return (
    <div className="min-h-[75vh] flex items-center justify-center">
      <div className="bg-white/70 backdrop-blur rounded-3xl shadow-sm border border-lavender-soft p-8 w-full max-w-md">
        <h1 className="font-display text-3xl text-ink mb-1">BreakNG Tables</h1>
        <p className="text-ink-soft text-sm mb-6">Production review room</p>

        {users.length > 0 && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">Who&apos;s this?</p>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => (
                <form action={loginAsExisting} key={u.id}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button
                    className="px-3 py-2 rounded-full text-sm font-medium text-ink shadow-sm hover:brightness-95 transition"
                    style={{ background: u.color }}
                  >
                    {u.name}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        <form action={loginAsNew} className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-ink-soft">New here?</p>
          <div className="flex gap-2">
            <input
              name="name"
              placeholder="Your name"
              required
              className="flex-1 rounded-xl border border-lavender-soft px-3 py-2 text-sm bg-white"
            />
            <button className="px-4 py-2 rounded-xl bg-lavender text-ink font-semibold text-sm shadow-sm hover:brightness-95">
              Join
            </button>
          </div>
        </form>

        <p className="text-[11px] text-ink-soft mt-6">
          No password — this is a small trusted team space. Pick your name each time you visit on a new device.
        </p>
      </div>
    </div>
  );
}
