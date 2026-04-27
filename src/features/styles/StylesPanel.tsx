import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus } from 'lucide-react';
import { useDocumentStore, type StyleKey } from '@/store/documentStore';
import { useSelectionStore } from '@/store/selectionStore';
import type {
  TextStyle, ParagraphStyle, BorderStyle, LineStyle, FillStyle,
  ElementModel, TextEl, RectEl, CircleEl, LineEl, PenEl, FrameEl, FlowableEl,
} from '@/types/document';
import StyleEditorModal, { type StyleEditorTarget } from './StyleEditorModal';

/* ─── Qué estilos aplican a cada tipo de elemento ─── */

const APPLICABLE: Record<StyleKey, ElementModel['type'][]> = {
  textStyles:      ['text', 'dataField'],
  paragraphStyles: ['text'],
  borderStyles:    ['rect', 'circle', 'frame', 'flowable'],
  lineStyles:      ['line', 'pen'],
  fillStyles:      ['rect', 'circle', 'frame', 'flowable'],
};

const KEY_LABELS: Record<StyleKey, string> = {
  textStyles:      'Estilos de texto',
  paragraphStyles: 'Estilos de párrafo',
  borderStyles:    'Estilos de borde',
  lineStyles:      'Estilos de línea',
  fillStyles:      'Estilos de relleno',
};

const STYLE_KEYS: StyleKey[] = [
  'textStyles', 'paragraphStyles', 'borderStyles', 'lineStyles', 'fillStyles',
];

/* ─── Aplicar estilo a un elemento ─── */

function applyStyle(el: ElementModel, key: StyleKey, style: unknown, update: (id: string, p: Partial<ElementModel>) => void) {
  switch (key) {
    case 'textStyles': {
      const s = style as TextStyle;
      if (el.type === 'text') {
        update(el.id, {
          fontSize: s.fontSize,
          fontFamily: s.fontId,
          fontWeight: s.subFont === 'Bold' || s.subFont === 'BoldItalic' ? 700 : 400,
          fontStyle: s.subFont === 'Italic' || s.subFont === 'BoldItalic' ? 'italic' : 'normal',
          color: s.fillStyleId || (el as TextEl).color,
        } as Partial<TextEl>);
      } else if (el.type === 'dataField') {
        update(el.id, {
          fontSize: s.fontSize,
          fontFamily: s.fontId,
          color: s.fillStyleId || (el as { color: string }).color,
        });
      }
      break;
    }
    case 'paragraphStyles': {
      const s = style as ParagraphStyle;
      if (el.type === 'text') {
        const alignMap: Record<string, TextEl['align']> = {
          Left: 'left', Center: 'center', Right: 'right', Justify: 'justify-block',
        };
        update(el.id, {
          align: alignMap[s.hAlign] ?? 'left',
          lineHeight: s.lineSpacing,
        } as Partial<TextEl>);
      }
      break;
    }
    case 'borderStyles': {
      const s = style as BorderStyle;
      if (el.type === 'rect' || el.type === 'frame') {
        update(el.id, { stroke: s.colorId, strokeWidth: s.lineWidth, cornerRadius: s.cornerRadius } as Partial<RectEl>);
      } else if (el.type === 'circle') {
        update(el.id, { stroke: s.colorId, strokeWidth: s.lineWidth } as Partial<CircleEl>);
      } else if (el.type === 'flowable') {
        update(el.id, { stroke: s.colorId, strokeWidth: s.lineWidth } as Partial<FlowableEl>);
      }
      break;
    }
    case 'lineStyles': {
      const s = style as LineStyle;
      if (el.type === 'line') {
        update(el.id, { strokeWidth: s.width, dash: s.dash } as Partial<LineEl>);
      } else if (el.type === 'pen') {
        update(el.id, { strokeWidth: s.width } as Partial<PenEl>);
      }
      break;
    }
    case 'fillStyles': {
      const s = style as FillStyle;
      if (el.type === 'rect' || el.type === 'circle' || el.type === 'frame' || el.type === 'flowable') {
        update(el.id, { fill: s.colorId } as Partial<RectEl>);
      }
      break;
    }
  }
}

/* ─── Componente principal ─── */

export default function StylesPanel() {
  const doc = useDocumentStore((s) => s.doc);
  const updateElement = useDocumentStore((s) => s.updateElement);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const [editor, setEditor] = useState<StyleEditorTarget | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    textStyles: true, paragraphStyles: true, borderStyles: true, lineStyles: true, fillStyles: true,
  });

  const selectedElements = useMemo<ElementModel[]>(() => {
    if (selectedIds.length === 0) return [];
    const set = new Set(selectedIds);
    return doc.pages.flatMap((p) => p.elements).filter((e) => set.has(e.id));
  }, [doc.pages, selectedIds]);

  const selectedTypes = useMemo(
    () => new Set(selectedElements.map((e) => e.type)),
    [selectedElements],
  );

  function canApply(key: StyleKey) {
    if (selectedElements.length === 0) return false;
    return APPLICABLE[key].some((t) => selectedTypes.has(t));
  }

  function handleApply(key: StyleKey, style: unknown) {
    const applicableTypes = new Set(APPLICABLE[key]);
    for (const el of selectedElements) {
      if (applicableTypes.has(el.type)) {
        applyStyle(el, key, style, updateElement);
      }
    }
  }

  function toggleSection(key: string) {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  }

  function openNew(key: StyleKey) {
    setEditor({ key, item: null } as StyleEditorTarget);
  }

  function openEdit(key: StyleKey, id: string) {
    const items = doc.assets[key] as { id: string }[];
    const found = items.find((i) => i.id === id);
    if (found) setEditor({ key, item: found } as StyleEditorTarget);
  }

  return (
    <div className="h-full overflow-y-auto">
      {selectedElements.length > 0 && (
        <div
          className="mx-3 mt-3 mb-1 px-2 py-1.5 rounded text-[10px]"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-dim)' }}
        >
          {selectedElements.length === 1
            ? '1 elemento seleccionado — haz clic en un estilo para aplicarlo'
            : `${selectedElements.length} elementos — haz clic para aplicar`}
        </div>
      )}

      <div className="flex flex-col">
        {STYLE_KEYS.map((key) => {
          const items = doc.assets[key] as { id: string; name: string }[];
          const isOpen = openSections[key];
          const applicable = canApply(key);

          return (
            <div key={key} style={{ borderBottom: '1px solid var(--line-2)' }}>
              {/* Cabecera de sección */}
              <div
                className="flex items-center h-8 px-2 cursor-default hover:bg-bg-3 select-none group"
                onClick={() => toggleSection(key)}
              >
                <span className="w-4 flex items-center justify-center text-muted">
                  {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </span>
                <span className="flex-1 text-11 font-semibold text-ink-2 ml-1">
                  {KEY_LABELS[key]}
                </span>
                <span className="font-mono text-[10px] text-muted mr-1">{items.length}</span>
                <button
                  type="button"
                  title={`Nuevo ${KEY_LABELS[key].toLowerCase()}`}
                  onClick={(e) => { e.stopPropagation(); openNew(key); }}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-bg-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus size={11} />
                </button>
              </div>

              {/* Items */}
              {isOpen && (
                <div className="pb-1">
                  {items.length === 0 && (
                    <div className="px-7 py-1.5 text-[10px] text-muted italic">
                      Sin estilos — usa + para crear uno
                    </div>
                  )}
                  {items.map((item) => (
                    <StyleItem
                      key={item.id}
                      styleKey={key}
                      item={item}
                      applicable={applicable}
                      onApply={() => handleApply(key, item)}
                      onEdit={() => openEdit(key, item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editor && (
        <StyleEditorModal target={editor} onClose={() => setEditor(null)} />
      )}
    </div>
  );
}

/* ─── Fila de estilo individual ─── */

function StyleItem({
  styleKey, item, applicable, onApply, onEdit,
}: {
  styleKey: StyleKey;
  item: { id: string; name: string } & Record<string, unknown>;
  applicable: boolean;
  onApply: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="flex items-center h-[28px] px-2 pl-7 gap-2 cursor-default select-none group hover:bg-bg-3"
      style={applicable ? { cursor: 'pointer' } : {}}
      onClick={applicable ? onApply : undefined}
      title={applicable ? `Aplicar "${item.name}"` : item.name}
    >
      {/* Miniatura visual */}
      <StylePreview styleKey={styleKey} item={item} />

      {/* Nombre */}
      <span
        className="flex-1 truncate text-11"
        style={{ color: applicable ? 'var(--ink)' : 'var(--ink-2)' }}
      >
        {item.name}
      </span>

      {/* Indicador aplicable */}
      {applicable && (
        <span
          className="text-[9px] font-semibold px-1 rounded opacity-0 group-hover:opacity-100"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          Aplicar
        </span>
      )}

      {/* Editar */}
      <button
        type="button"
        title="Editar estilo"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-bg-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <Pencil size={11} />
      </button>
    </div>
  );
}

/* ─── Miniatura visual por tipo ─── */

function StylePreview({ styleKey, item }: { styleKey: StyleKey; item: Record<string, unknown> }) {
  if (styleKey === 'fillStyles') {
    return (
      <div
        className="w-4 h-4 rounded shrink-0 border"
        style={{ background: (item.colorId as string) || '#ccc', borderColor: 'var(--line-2)' }}
      />
    );
  }
  if (styleKey === 'borderStyles') {
    return (
      <div
        className="w-4 h-4 rounded shrink-0"
        style={{
          border: `${Math.min(Number(item.lineWidth) || 1, 3)}px solid ${(item.colorId as string) || '#000'}`,
        }}
      />
    );
  }
  if (styleKey === 'lineStyles') {
    const dash = item.dash as number[] | undefined;
    return (
      <div className="w-4 h-4 flex items-center shrink-0">
        <div
          className="w-full"
          style={{
            height: `${Math.min(Number(item.width) || 1, 3)}px`,
            background: 'var(--ink)',
            borderRadius: 2,
            ...(dash?.length ? { backgroundImage: 'repeating-linear-gradient(90deg,var(--ink) 0 4px,transparent 4px 7px)' } : {}),
          }}
        />
      </div>
    );
  }
  if (styleKey === 'textStyles') {
    return (
      <div
        className="w-4 h-4 flex items-center justify-center shrink-0 font-bold rounded text-[9px]"
        style={{ background: 'var(--bg-3)', color: (item.fillStyleId as string) || 'var(--ink)' }}
      >
        A
      </div>
    );
  }
  if (styleKey === 'paragraphStyles') {
    return (
      <div className="w-4 h-4 flex flex-col justify-center gap-0.5 shrink-0">
        <div className="w-full h-px" style={{ background: 'var(--ink-2)' }} />
        <div className="w-3/4 h-px" style={{ background: 'var(--ink-2)' }} />
        <div className="w-full h-px" style={{ background: 'var(--ink-2)' }} />
      </div>
    );
  }
  return <div className="w-4 h-4 shrink-0" />;
}
