import { useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type {
  TextStyle, ParagraphStyle, BorderStyle, LineStyle, FillStyle,
  CapStyle, LineDashStyle, CornerStyle,
} from '@/types/document';
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

  const modalWidth = target.key === 'borderStyles' || target.key === 'lineStyles' ? 420 : 380;

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
          width: modalWidth,
          maxHeight: '85vh',
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

/* ─── Row helpers ─── */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-11 text-muted w-36 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      {label && <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">{label}</span>}
      <div className="flex-1 h-px" style={{ background: 'var(--line-2)' }} />
    </div>
  );
}

function NumInput({
  value, onChange, min = 0, max, step = 1, unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        className="field flex-1 min-w-0"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {unit && <span className="text-[10px] text-muted shrink-0 w-6">{unit}</span>}
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded shrink-0 border cursor-pointer relative overflow-hidden"
        style={{ borderColor: 'var(--line-2)' }}
      >
        <input
          type="color"
          value={value.startsWith('#') ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          style={{ padding: 0, border: 'none' }}
        />
        <div className="w-full h-full rounded" style={{ background: value }} />
      </div>
      <input
        className="field flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
      />
    </div>
  );
}

/* ─── BorderStyle fields ─── */

const DASH_PATTERNS: { value: LineDashStyle; label: string; preview: number[] | null }[] = [
  { value: 'Solid',   label: 'Sólido',       preview: null },
  { value: 'Dashed',  label: 'Guiones',       preview: [8, 4] },
  { value: 'Dotted',  label: 'Puntos',        preview: [2, 4] },
  { value: 'DashDot', label: 'Punto-guión',   preview: [8, 4, 2, 4] },
];

const CAP_OPTIONS: { value: CapStyle; label: string }[] = [
  { value: 'Butt',   label: 'Plano (Butt)' },
  { value: 'Round',  label: 'Redondo (Round)' },
  { value: 'Square', label: 'Cuadrado (Square)' },
];

const CORNER_OPTIONS: { value: CornerStyle; label: string }[] = [
  { value: 'Standard', label: 'Estándar (Miter)' },
  { value: 'Round',    label: 'Redondo' },
  { value: 'Bevel',    label: 'Bisel' },
];

function DashPreviewSvg({ pattern, color = 'currentColor' }: { pattern: number[] | null; color?: string }) {
  const w = 48;
  const h = 8;
  const strokeDasharray = pattern ? pattern.join(' ') : undefined;
  return (
    <svg width={w} height={h} style={{ display: 'block', flexShrink: 0 }}>
      <line
        x1="2" y1={h / 2} x2={w - 2} y2={h / 2}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="butt"
        strokeDasharray={strokeDasharray}
      />
    </svg>
  );
}

function BorderPreview({ draft }: { draft: BorderStyle }) {
  const w = 200;
  const h = 56;
  const pad = 12;
  const r = draft.corner === 'Round' ? Math.min(draft.radiusX, (w - pad * 2) / 2, (h - pad * 2) / 2) : 0;
  const dashPattern = DASH_PATTERNS.find((d) => d.value === (draft.lineDash ?? 'Solid'));
  const strokeDasharray = dashPattern?.preview ? dashPattern.preview.join(' ') : undefined;
  const strokeWidth = Math.max(0.5, Math.min(draft.lineWidth, 6));

  return (
    <div
      className="flex items-center justify-center rounded"
      style={{ background: 'var(--bg-0)', border: '1px solid var(--line-2)', padding: '8px 0' }}
    >
      <svg width={w} height={h}>
        <rect
          x={pad + strokeWidth / 2}
          y={pad + strokeWidth / 2}
          width={w - pad * 2 - strokeWidth}
          height={h - pad * 2 - strokeWidth}
          rx={r}
          ry={r}
          fill="none"
          stroke={draft.colorId || '#000'}
          strokeWidth={strokeWidth}
          strokeLinecap={(draft.cap ?? 'Butt').toLowerCase() as 'butt' | 'round' | 'square'}
          strokeLinejoin={draft.corner === 'Round' ? 'round' : draft.corner === 'Bevel' ? 'bevel' : 'miter'}
          strokeDasharray={strokeDasharray}
        />
      </svg>
    </div>
  );
}

function BorderStyleFields({ draft, patch }: { draft: BorderStyle; patch: (p: Partial<BorderStyle>) => void }) {
  const cap = draft.cap ?? 'Butt';
  const lineDash = draft.lineDash ?? 'Solid';
  const corner = draft.corner ?? 'Standard';
  const radiusX = draft.radiusX ?? 0;
  const radiusY = draft.radiusY ?? 0;
  const selectedDash = DASH_PATTERNS.find((d) => d.value === lineDash) ?? DASH_PATTERNS[0];

  return (
    <>
      {/* Vista previa */}
      <BorderPreview draft={{ ...draft, cap, lineDash, corner, radiusX, radiusY }} />

      <Divider label="Línea" />

      {/* Color de relleno de línea */}
      <Row label="Color de línea">
        <ColorInput value={draft.colorId || '#000000'} onChange={(v) => patch({ colorId: v })} />
      </Row>

      {/* Grosor */}
      <Row label="Grosor de línea">
        <NumInput
          value={draft.lineWidth}
          min={0}
          step={0.05}
          unit="mm"
          onChange={(v) => patch({ lineWidth: v })}
        />
      </Row>

      {/* Estilo de extremo */}
      <Row label="Extremo (Cap)">
        <select
          className="field w-full"
          value={cap}
          onChange={(e) => patch({ cap: e.target.value as CapStyle })}
        >
          {CAP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Row>

      {/* Patrón de línea */}
      <Row label="Estilo de línea">
        <div className="flex items-center gap-2">
          <select
            className="field flex-1"
            value={lineDash}
            onChange={(e) => patch({ lineDash: e.target.value as LineDashStyle })}
          >
            {DASH_PATTERNS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <DashPreviewSvg pattern={selectedDash.preview} color="var(--ink)" />
        </div>
      </Row>

      <Divider label="Esquinas" />

      {/* Tipo de esquina */}
      <Row label="Esquina">
        <select
          className="field w-full"
          value={corner}
          onChange={(e) => patch({ corner: e.target.value as CornerStyle })}
        >
          {CORNER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Row>

      {/* Radio X */}
      <Row label="Radio X">
        <NumInput
          value={radiusX}
          min={0}
          step={0.5}
          unit="mm"
          onChange={(v) => patch({ radiusX: v })}
        />
      </Row>

      {/* Radio Y */}
      <Row label="Radio Y">
        <NumInput
          value={radiusY}
          min={0}
          step={0.5}
          unit="mm"
          onChange={(v) => patch({ radiusY: v })}
        />
      </Row>
    </>
  );
}

/* ─── LineStyle fields ─── */

const LINE_JOIN_OPTIONS: { value: LineStyle['join']; label: string }[] = [
  { value: 'Miter', label: 'Miter (punta)' },
  { value: 'Round', label: 'Redondo' },
  { value: 'Bevel', label: 'Bisel' },
];

function LineStyleFields({ draft, patch }: { draft: LineStyle; patch: (p: Partial<LineStyle>) => void }) {
  const cap = draft.cap ?? 'Butt';
  const join = draft.join ?? 'Round';
  const selectedDash = DASH_PATTERNS.find(
    (d) => JSON.stringify(d.preview) === JSON.stringify(draft.dash ?? null),
  ) ?? DASH_PATTERNS[0];

  return (
    <>
      {/* Vista previa */}
      <div
        className="flex items-center justify-center rounded"
        style={{ background: 'var(--bg-0)', border: '1px solid var(--line-2)', padding: '12px 16px' }}
      >
        <svg width={180} height={20}>
          <line
            x1="4"
            y1="10"
            x2="176"
            y2="10"
            stroke={draft.colorId || 'var(--ink)'}
            strokeWidth={Math.max(1, Math.min(draft.width * 3, 10))}
            strokeLinecap={(cap).toLowerCase() as 'butt' | 'round' | 'square'}
            strokeDasharray={draft.dash?.join(' ')}
          />
        </svg>
      </div>

      <Divider label="Trazo" />

      {draft.colorId !== undefined && (
        <Row label="Color">
          <ColorInput value={draft.colorId || '#000000'} onChange={(v) => patch({ colorId: v })} />
        </Row>
      )}

      <Row label="Grosor">
        <NumInput value={draft.width} min={0} step={0.1} unit="mm" onChange={(v) => patch({ width: v })} />
      </Row>

      <Row label="Extremo (Cap)">
        <select
          className="field w-full"
          value={cap}
          onChange={(e) => patch({ cap: e.target.value as CapStyle })}
        >
          {CAP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Row>

      <Row label="Unión (Join)">
        <select
          className="field w-full"
          value={join}
          onChange={(e) => patch({ join: e.target.value as LineStyle['join'] })}
        >
          {LINE_JOIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Row>

      <Row label="Patrón">
        <div className="flex items-center gap-2">
          <select
            className="field flex-1"
            value={selectedDash.value}
            onChange={(e) => {
              const found = DASH_PATTERNS.find((d) => d.value === e.target.value);
              patch({ dash: found?.preview ?? undefined });
            }}
          >
            {DASH_PATTERNS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <DashPreviewSvg pattern={selectedDash.preview} color="var(--ink)" />
        </div>
      </Row>
    </>
  );
}

/* ─── TextStyle fields ─── */

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

/* ─── ParagraphStyle fields ─── */

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

/* ─── FillStyle fields ─── */

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
      return {
        id,
        name: 'Nuevo estilo de borde',
        colorId: '#000000',
        lineWidth: 0.25,
        cap: 'Butt',
        lineDash: 'Solid',
        corner: 'Standard',
        radiusX: 0,
        radiusY: 0,
      } satisfies BorderStyle;
    case 'lineStyles':
      return {
        id,
        name: 'Nuevo estilo de línea',
        width: 0.5,
        cap: 'Butt',
        join: 'Round',
      } satisfies LineStyle;
    case 'fillStyles':
      return { id, name: 'Nuevo relleno', colorId: '#ffffff' } satisfies FillStyle;
  }
}
