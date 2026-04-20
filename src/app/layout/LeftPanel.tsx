import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import LayoutTree from '@/features/tree/LayoutTree';
import Inspector from '@/features/properties/Inspector';

/**
 * Panel izquierdo dividido verticalmente:
 *  - Superior: LayoutTree (react-arborist)
 *  - Inferior: LayoutProperties / Inspector
 */
export default function LeftPanel() {
  return (
    <div className="h-full flex flex-col">
      <PanelGroup direction="vertical" autoSaveId="left-panel">
        <Panel defaultSize={55} minSize={20}>
          <div className="h-full flex flex-col">
            <SectionHeader title="Layout Tree" />
            <div className="flex-1 overflow-auto">
              <LayoutTree />
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="h-px bg-line hover:bg-accent-dim transition-colors" />
        <Panel defaultSize={45} minSize={20}>
          <div className="h-full flex flex-col">
            <SectionHeader title="Layout Properties" />
            <div className="flex-1 overflow-auto">
              <Inspector />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="h-7 px-2 flex items-center border-b border-line-2 bg-bg-2">
      <span className="text-11 font-semibold text-ink uppercase tracking-wide">{title}</span>
      <div className="ml-auto flex items-center gap-0.5">
        <button
          type="button"
          className="w-5 h-5 rounded-3 hover:bg-bg-3 text-ink-2 flex items-center justify-center"
          aria-label="Añadir"
        >
          <Plus size={12} />
        </button>
        <button
          type="button"
          className="w-5 h-5 rounded-3 hover:bg-bg-3 text-ink-2 flex items-center justify-center"
          aria-label="Buscar"
        >
          <Search size={12} />
        </button>
        <button
          type="button"
          className="w-5 h-5 rounded-3 hover:bg-bg-3 text-ink-2 flex items-center justify-center"
          aria-label="Más"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
    </div>
  );
}
