import { Undo2, Redo2, FileDown } from 'lucide-react';
import { useDocumentHistory } from '@/store/documentStore';

const items = ['Archivo', 'Editar', 'Ver', 'Insertar', 'Formato', 'Datos', 'Ayuda'];

export default function MenuBar() {
  const history = useDocumentHistory();

  return (
    <div className="h-full bg-bg-1 flex items-center px-2 gap-1 text-11">
      {items.map((it) => (
        <button
          key={it}
          className="h-[24px] px-2 rounded-3 hover:bg-bg-3 text-ink"
          type="button"
        >
          {it}
        </button>
      ))}

      <div className="ml-3 flex items-center gap-1">
        <button
          className="h-[24px] px-2 rounded-3 hover:bg-bg-3 flex items-center gap-1.5 text-ink-2 disabled:opacity-40"
          onClick={() => history.getState().undo()}
          title="Deshacer (⌘Z)"
          type="button"
        >
          <Undo2 size={13} />
          <span className="font-mono text-[10px]">⌘Z</span>
        </button>
        <button
          className="h-[24px] px-2 rounded-3 hover:bg-bg-3 flex items-center gap-1.5 text-ink-2 disabled:opacity-40"
          onClick={() => history.getState().redo()}
          title="Rehacer (⌘⇧Z)"
          type="button"
        >
          <Redo2 size={13} />
          <span className="font-mono text-[10px]">⌘⇧Z</span>
        </button>
      </div>

      <div className="ml-auto">
        <button
          className="h-[24px] px-3 rounded-3 flex items-center gap-1.5 font-semibold"
          style={{ background: 'var(--accent)', color: '#0b1a10' }}
          type="button"
        >
          <FileDown size={13} />
          Exportar PDF
        </button>
      </div>
    </div>
  );
}
