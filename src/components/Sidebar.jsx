"use client";

function relativeDate(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Sidebar({ apps, selectedApp, onSelect, onNew, open, onClose }) {
  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0",
      ].join(" ")}
    >
      {/* New app button */}
      <div className="p-3 border-b border-line">
        <button
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <span className="text-base leading-none">+</span>
          New app
        </button>
      </div>

      {/* App list */}
      <div className="flex-1 overflow-y-auto">
        {apps.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-ink/40">
            No apps yet — grow your first one!
          </p>
        ) : (
          apps.map((app) => {
            const active = selectedApp?.id === app.id;
            return (
              <button
                key={app.id}
                onClick={() => onSelect(app)}
                className={[
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  active ? "bg-surface" : "hover:bg-surface",
                ].join(" ")}
              >
                <span className="shrink-0 text-xl leading-none">{app.emoji}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-snug">{app.name}</p>
                  <p className="text-xs text-ink/40">{relativeDate(app.updatedAt)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer — reserved for profile / settings */}
      <div className="border-t border-line p-3" />
    </aside>
  );
}
