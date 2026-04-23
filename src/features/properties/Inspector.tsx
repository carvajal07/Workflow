import { useState } from 'react';
import PageSizePicker from '@/features/pages/PageSizePicker';
import { useDocumentStore } from '@/store/documentStore';
import { useSelectionStore } from '@/store/selectionStore';
import PositionTab from './PositionTab';

type TabId = 'Posición' | 'General' | 'Guías' | 'Heads';
const TABS: TabId[] = ['Posición', 'General', 'Guías', 'Heads'];

/**
 * Inspector contextual: si no hay selección muestra propiedades de la
 * página actual (incluyendo PageSizePicker); si hay selección muestra
 * los tabs Posición/General/Guías/Heads.
 */
export default function Inspector() {
  const pages = useDocumentStore((s) => s.doc.pages);
  const currentPageId = useDocumentStore((s) => s.currentPageId);
  const page = pages.find((p) => p.id === currentPageId) ?? pages[0];
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const [tab, setTab] = useState<TabId>('Posición');

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="p-3 text-11">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
        <span className="text-ink">
          {hasSelection
            ? `${selectedIds.length} elemento(s) seleccionado(s)`
            : `${page?.name ?? 'Page'} — Page`}
        </span>
      </div>

      <div className="border-b border-line-2 flex gap-4 mb-3">
        {TABS.map((t) => {
          const isActive = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="h-6 text-11"
              style={
                isActive
                  ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }
                  : { color: 'var(--ink-2)' }
              }
            >
              {t}
            </button>
          );
        })}
      </div>

      {!hasSelection && page && (
        <div className="flex flex-col gap-3">
          <SectionTitle>Tamaño de hoja</SectionTitle>
          <PageSizePicker />
        </div>
      )}

      {hasSelection && tab === 'Posición' && <PositionTab />}
      {hasSelection && tab !== 'Posición' && (
        <div className="text-muted">Pendiente de implementar.</div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted border-b border-line-2 pb-1">
      {children}
    </div>
  );
}
