/**
 * Stub del Inspector de propiedades. Se completará con tabs y fields en
 * el siguiente commit (Posición, General, Guías, Heads).
 */
export default function Inspector() {
  return (
    <div className="p-3 text-11 text-muted">
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
        <span className="text-ink">Page 1 — Page</span>
      </div>
      <div className="border-b border-line-2 flex gap-4 mb-3">
        {['Posición', 'General', 'Guías', 'Heads'].map((t, i) => (
          <button
            key={t}
            type="button"
            className="h-6 text-11"
            style={
              i === 0
                ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }
                : { color: 'var(--ink-2)' }
            }
          >
            {t}
          </button>
        ))}
      </div>
      <div className="text-ink-2">Selecciona un elemento para ver sus propiedades.</div>
    </div>
  );
}
