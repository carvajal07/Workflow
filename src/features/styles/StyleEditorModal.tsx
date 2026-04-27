import { useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { TextStyle, ParagraphStyle, BorderStyle, LineStyle, FillStyle } from '@/types/document';
import { useDocumentStore, type StyleKey, type AnyStyleItem } from '@/store/documentStore';
import { nextId } from '@/utils/id';

export type StyleEditorTarget =
  | { key: 'textStyles'; item: TextStyle | null }
  | { key: 'paragraphStyles'; item: ParagraphStyle | null }
  | { key: 'borderStyles'; item: BorderStyle | null }
  | { key: 'lineStyles'; item: LineStyle | null }
  | { key: 'fillStyles'; item: FillStyle | null };

interface Props {
  target: StyleEditorTarget;
  onClose: () => void;
}

const KEY_LABELS: Record<StyleKey, string> = {
  textStyles: 'Estilo de texto',
  paragraphStyles: 'Estilo de párrafo',
  borderStyles: 'Estilo de borde',
  lineStyles: 'Estilo de línea',
  fillStyles: 'Estilo de relleno',
};

export default function StyleEditorModal({ target, onClose }: Props) {
  const addStyle = useDocumentStore((s) => s.addStyle);
  const updateStyle = useDocumentStore((s) => s.updateStyle);
  const removeStyle = useDocumentStore((s) => s.removeStyle);

  const isNew = target.item === null;
  const [draft, setDraft] = useState<AnyStyleItem>(() => buildDefault(target));

  useEffect(() => {
    setDraft(buildDefault(target));
  }, [target.key, target.item?.id]);

  const overlayRef = useRef<HTMLDivElement>(null);

  function save() {
    if (isNew) {
      addStyle(target.key, draft);
    } else {
      updateStyle(target.key, draft.id, draft);
    }
    onClose();
  }

  function del() {
    if (!isNew) removeStyle(target.key, draft.id);
    onClose();
  }

  function patch(p: Partial<AnyStyleItem>) {
    setDraft((d) => ({ ...d, ...p } as AnyStyleItem));
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="rounded-lg shadow-2xl flex flex-col"
        style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--bg-3)',
          width: 380,
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="h-10 shrink-0 flex items-center px-4 gap-2"
          style={{ borderBottom: '1px solid var(--bg-3)' }}
        >
          <span className="font-semibold text-sm text-ink flex-1">
            {isNew ? `Nuevo ${KEY_LABELS[target.key]}` : KEY_LABELS[target.key]}
          </span>
          {!isNew && (
            <button
              type="button"
              onClick={del}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/20 text-red-400"
              title="Eliminar estilo"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-3 text-muted"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {/* Nombre — siempre */}
          <Row label="Nombre">
            <input
              className="field"
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </Row>

          {target.key === 'textStyles' && (
            <TextStyleFields draft={draft as TextStyle} patch={patch} />
          )}
          {target.key === 'paragraphStyles' && (
            <ParagraphStyleFields draft={draft as ParagraphStyle} patch={patch} />
          )}
          {target.key === 'borderStyles' && (
            <BorderStyleFields draft={draft as BorderStyle} patch={patch} />
          )}
          {target.key === 'lineStyles' && (
            <LineStyleFields draft={draft as LineStyle} patch={patch} />
          )}
          {target.key === 'fillStyles' && (
            <FillStyleFields draft={draft as FillStyle} patch={patch} />
          )}
        </div>

        {/* Footer */}
        <div
          className="h-12 shrink-0 flex items-center justify-end gap-2 px-4"
          style={{ borderTop: '1px solid var(--bg-3)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-8 rounded text-sm hover:bg-bg-3 text-ink-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            className="px-4 h-8 rounded text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#0b1a10' }}
          >
            {isNew ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Campo helpers ─── */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-11 text-muted w-32 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, min, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  return (
    <input
      type="number"
      className="field w-full"
      value={value}
      min={min}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value.startsWith('#') ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-7 rounded cursor-pointer border-0 p-0.5"
        style={{ background: 'var(--bg-2)' }}
      />
      <input
        className="field flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
      />
    </div>
  );
}

/* ─── Campos por tipo ─── */

function TextStyleFields({ draft, patch }: { draft: TextStyle; patch: (p: Partial<TextStyle>) => void }) {
  return (
    <>
      <Row label="Tamaño (pt)">
        <NumInput value={draft.fontSize} min={1} onChange={(v) => patch({ fontSize: v })} />
      </Row>
      <Row label="Fuente">
        <input className="field" value={draft.fontId} onChange={(e) => patch({ fontId: e.target.value })} placeholder="Arial" />
      </Row>
      <Row label="Variante">
        <select className="field" value={draft.subFont} onChange={(e) => patch({ subFont: e.target.value })}>
          {['Regular', 'Bold', 'Italic', 'BoldItalic'].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </Row>
      <Row label="Color">
        <ColorInput value={draft.fillStyleId || '#000000'} onChange={(v) => patch({ fillStyleId: v })} />
      </Row>
    </>
  );
}

function ParagraphStyleFields({ draft, patch }: { draft: ParagraphStyle; patch: (p: Partial<ParagraphStyle>) => void }) {
  return (
    <>
      <Row label="Alineación">
        <select className="field" value={draft.hAlign} onChange={(e) => patch({ hAlign: e.target.value as ParagraphStyle['hAlign'] })}>
          {(['Left', 'Center', 'Right', 'Justify'] as const).map((v) => (
            <option key={v} value={v}>{{ Left: 'Izquierda', Center: 'Centro', Right: 'Derecha', Justify: 'Justificado' }[v]}</option>
          ))}
        </select>
      </Row>
      <Row label="Sangría izq. (mm)">
        <NumInput value={draft.leftIndent} min={0} step={0.5} onChange={(v) => patch({ leftIndent: v })} />
      </Row>
      <Row label="Sangría der. (mm)">
        <NumInput value={draft.rightIndent} min={0} step={0.5} onChange={(v) => patch({ rightIndent: v })} />
      </Row>
      <Row label="Primera línea (mm)">
        <NumInput value={draft.firstLineLeftIndent} step={0.5} onChange={(v) => patch({ firstLineLeftIndent: v })} />
      </Row>
      <Row label="Espacio antes (mm)">
        <NumInput value={draft.spaceBefore} min={0} step={0.5} onChange={(v) => patch({ spaceBefore: v })} />
      </Row>
      <Row label="Espacio después (mm)">
        <NumInput value={draft.spaceAfter} min={0} step={0.5} onChange={(v) => patch({ spaceAfter: v })} />
      </Row>
      <Row label="Interlineado (mm)">
        <NumInput value={draft.lineSpacing} min={0} step={0.5} onChange={(v) => patch({ lineSpacing: v })} />
      </Row>
      <Row label="No cortar líneas">
        <select className="field" value={draft.keepLinesTogether} onChange={(e) => patch({ keepLinesTogether: e.target.value as 'Yes' | 'No' })}>
          <option value="No">No</option>
          <option value="Yes">Sí</option>
        </select>
      </Row>
    </>
  );
}

function BorderStyleFields({ draft, patch }: { draft: BorderStyle; patch: (p: Partial<BorderStyle>) => void }) {
  return (
    <>
      <Row label="Color">
        <ColorInput value={draft.colorId || '#000000'} onChange={(v) => patch({ colorId: v })} />
      </Row>
      <Row label="Grosor (pt)">
        <NumInput value={draft.lineWidth} min={0} step={0.5} onChange={(v) => patch({ lineWidth: v })} />
      </Row>
      <Row label="Radio de esquina">
        <NumInput value={draft.cornerRadius} min={0} step={1} onChange={(v) => patch({ cornerRadius: v })} />
      </Row>
    </>
  );
}

function LineStyleFields({ draft, patch }: { draft: LineStyle; patch: (p: Partial<LineStyle>) => void }) {
  const dashStr = (draft.dash ?? []).join(', ');
  return (
    <>
      <Row label="Grosor (pt)">
        <NumInput value={draft.width} min={0} step={0.5} onChange={(v) => patch({ width: v })} />
      </Row>
      <Row label="Discontinuidad">
        <input
          className="field"
          value={dashStr}
          placeholder="p.ej. 6, 3"
          onChange={(e) => {
            const nums = e.target.value
              .split(',')
              .map((n) => parseFloat(n.trim()))
              .filter((n) => !isNaN(n));
            patch({ dash: nums.length > 0 ? nums : undefined });
          }}
        />
      </Row>
    </>
  );
}

function FillStyleFields({ draft, patch }: { draft: FillStyle; patch: (p: Partial<FillStyle>) => void }) {
  return (
    <Row label="Color">
      <ColorInput value={draft.colorId || '#ffffff'} onChange={(v) => patch({ colorId: v })} />
    </Row>
  );
}

/* ─── Default builders ─── */

function buildDefault(target: StyleEditorTarget): AnyStyleItem {
  if (target.item) return { ...target.item };
  const id = nextId('style');
  switch (target.key) {
    case 'textStyles':
      return { id, name: 'Nuevo estilo de texto', fontSize: 12, fontId: 'Arial', subFont: 'Regular', fillStyleId: '#000000' } satisfies TextStyle;
    case 'paragraphStyles':
      return {
        id, name: 'Nuevo estilo de párrafo',
        leftIndent: 0, rightIndent: 0, firstLineLeftIndent: 0,
        spaceBefore: 0, spaceAfter: 0, lineSpacing: 5,
        widow: 1, orphan: 1, keepWithNext: false,
        keepLinesTogether: 'No', dontWrap: false, hAlign: 'Left',
      } satisfies ParagraphStyle;
    case 'borderStyles':
      return { id, name: 'Nuevo estilo de borde', colorId: '#000000', lineWidth: 1, cornerRadius: 0 } satisfies BorderStyle;
    case 'lineStyles':
      return { id, name: 'Nuevo estilo de línea', width: 1 } satisfies LineStyle;
    case 'fillStyles':
      return { id, name: 'Nuevo relleno', colorId: '#ffffff' } satisfies FillStyle;
  }
}
