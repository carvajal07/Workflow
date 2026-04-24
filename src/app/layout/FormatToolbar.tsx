import { useMemo } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { TextEl } from '@/types/document';

type Align = TextEl['align'];

const FONT_FAMILIES = ['Inter', 'JetBrains Mono', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New'];
const FONT_VARIANTS = ['Regular', 'Medium', 'Semi-Bold', 'Bold', 'Italic'];

/**
 * Barra de formato: conectada al/los TextEl seleccionado(s).
 * - Cambios en familia, tamaño, B/I/U/S, color, align y justify aplican
 *   en todos los seleccionados vía `updateElement`.
 * - Si no hay ningún TextEl seleccionado, los controles se muestran
 *   pero deshabilitados.
 */
export default function FormatToolbar() {
  const pages = useDocumentStore((s) => s.doc.pages);
  const updateElement = useDocumentStore((s) => s.updateElement);
  const selectedIds = useSelectionStore((s) => s.selectedIds);

  const selectedTexts = useMemo<TextEl[]>(() => {
    if (selectedIds.length === 0) return [];
    const idSet = new Set(selectedIds);
    return pages
      .flatMap((p) => p.elements)
      .filter((e): e is TextEl => idSet.has(e.id) && e.type === 'text');
  }, [pages, selectedIds]);

  const disabled = selectedTexts.length === 0;

  function common<K extends keyof TextEl>(key: K): TextEl[K] | undefined {
    if (selectedTexts.length === 0) return undefined;
    const first = selectedTexts[0][key];
    return selectedTexts.every((e) => e[key] === first) ? first : undefined;
  }

  function apply(patch: Partial<TextEl>) {
    for (const el of selectedTexts) updateElement(el.id, patch);
  }

  const fontFamily = (common('fontFamily') as string | undefined) ?? '';
  const fontWeight = common('fontWeight') as number | undefined;
  const fontStyle = common('fontStyle') as TextEl['fontStyle'] | undefined;
  const fontSize = common('fontSize') as number | undefined;
  const align = common('align') as Align | undefined;
  const decoration = common('textDecoration') as TextEl['textDecoration'] | undefined;
  const color = (common('color') as string | undefined) ?? '#000000';

  const variantLabel =
    fontStyle === 'italic' ? 'Italic' : fontWeight === undefined ? '' : weightLabel(fontWeight);

  return (
    <div className="h-full bg-bg-1 flex items-center px-2 gap-1.5 text-11">
      {/* Fuente */}
      <select
        disabled={disabled}
        value={fontFamily}
        onChange={(e) => apply({ fontFamily: e.target.value })}
        className="h-[22px] bg-bg-3 border border-line-2 rounded-3 text-11 px-1.5 outline-none disabled:opacity-50"
        style={{ width: 130 }}
      >
        {fontFamily === '' && <option value="">—</option>}
        {FONT_FAMILIES.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        disabled={disabled}
        value={variantLabel}
        onChange={(e) => apply(variantToPatch(e.target.value))}
        className="h-[22px] bg-bg-3 border border-line-2 rounded-3 text-11 px-1.5 outline-none disabled:opacity-50"
        style={{ width: 96 }}
      >
        {variantLabel === '' && <option value="">—</option>}
        {FONT_VARIANTS.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <NumberField
        disabled={disabled}
        value={fontSize}
        onCommit={(v) => apply({ fontSize: v })}
        width={54}
        min={1}
      />
      <select
        disabled={disabled}
        defaultValue="pt"
        className="h-[22px] bg-bg-3 border border-line-2 rounded-3 text-11 px-1.5 outline-none disabled:opacity-50"
        style={{ width: 48 }}
      >
        <option value="pt">pt</option>
        <option value="px">px</option>
        <option value="mm">mm</option>
      </select>

      <Sep />

      {/* Estilo */}
      <Toggle
        icon={Bold}
        label="Bold"
        disabled={disabled}
        active={fontWeight !== undefined && fontWeight >= 600}
        onClick={() => apply({ fontWeight: (fontWeight ?? 400) >= 600 ? 400 : 700 })}
      />
      <Toggle
        icon={Italic}
        label="Itálica"
        disabled={disabled}
        active={fontStyle === 'italic'}
        onClick={() => apply({ fontStyle: fontStyle === 'italic' ? 'normal' : 'italic' })}
      />
      <Toggle
        icon={Underline}
        label="Subrayado"
        disabled={disabled}
        active={decoration === 'underline'}
        onClick={() =>
          apply({ textDecoration: decoration === 'underline' ? undefined : 'underline' })
        }
      />
      <Toggle
        icon={Strikethrough}
        label="Tachado"
        disabled={disabled}
        active={decoration === 'line-through'}
        onClick={() =>
          apply({ textDecoration: decoration === 'line-through' ? undefined : 'line-through' })
        }
      />
      <label
        className="w-[22px] h-[22px] rounded-3 border border-line-2 relative cursor-pointer"
        style={{ background: color, opacity: disabled ? 0.5 : 1 }}
        title={`Color (${color})`}
      >
        <input
          type="color"
          disabled={disabled}
          value={color}
          onChange={(e) => apply({ color: e.target.value })}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </label>

      <Sep />

      {/* Alineación */}
      <Toggle
        icon={AlignLeft}
        label="Alinear izquierda"
        disabled={disabled}
        active={align === 'left'}
        onClick={() => apply({ align: 'left' })}
      />
      <Toggle
        icon={AlignCenter}
        label="Centrar"
        disabled={disabled}
        active={align === 'center'}
        onClick={() => apply({ align: 'center' })}
      />
      <Toggle
        icon={AlignRight}
        label="Alinear derecha"
        disabled={disabled}
        active={align === 'right'}
        onClick={() => apply({ align: 'right' })}
      />

      <Sep />

      {/* Justificación (última línea) */}
      <Toggle
        icon={JustifyLastIcon('left')}
        label="Justificar — última línea izquierda"
        disabled={disabled}
        active={align === 'justify-left'}
        onClick={() => apply({ align: 'justify-left' })}
      />
      <Toggle
        icon={JustifyLastIcon('center')}
        label="Justificar — última línea centrada"
        disabled={disabled}
        active={align === 'justify-center'}
        onClick={() => apply({ align: 'justify-center' })}
      />
      <Toggle
        icon={JustifyLastIcon('right')}
        label="Justificar — última línea derecha"
        disabled={disabled}
        active={align === 'justify-right'}
        onClick={() => apply({ align: 'justify-right' })}
      />
      <Toggle
        icon={AlignJustify}
        label="Justificar bloque"
        disabled={disabled}
        active={align === 'justify-block'}
        onClick={() => apply({ align: 'justify-block' })}
      />

      <div className="ml-auto">
        <select
          disabled={disabled}
          className="h-[22px] bg-bg-3 border border-line-2 rounded-3 text-11 px-1.5 outline-none disabled:opacity-50"
          style={{ width: 150 }}
        >
          <option>Normal</option>
          <option>Título 1</option>
          <option>Título 2</option>
          <option>Cita</option>
        </select>
      </div>
    </div>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-line-2 mx-1.5" />;
}

interface ToggleProps {
  icon: React.ComponentType<{ size?: number | string }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function Toggle({ icon: Icon, label, active = false, disabled = false, onClick }: ToggleProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="w-[22px] h-[22px] flex items-center justify-center rounded-3 text-ink-2 hover:bg-bg-3 hover:text-ink disabled:opacity-40 disabled:pointer-events-none"
      style={active ? { background: 'var(--bg-4)', color: 'var(--accent)' } : undefined}
    >
      <Icon size={13} />
    </button>
  );
}

interface NumberFieldProps {
  value: number | undefined;
  onCommit: (v: number) => void;
  width?: number;
  disabled?: boolean;
  min?: number;
}

function NumberField({ value, onCommit, width = 54, disabled = false, min }: NumberFieldProps) {
  const display = value === undefined ? '' : String(value);
  return (
    <div
      className="h-[22px] flex items-center bg-bg-3 border border-line-2 rounded-3 px-1.5"
      style={{ width, opacity: disabled ? 0.5 : 1 }}
    >
      <input
        type="number"
        step={0.5}
        {...(min !== undefined ? { min } : {})}
        disabled={disabled}
        placeholder={value === undefined ? '—' : undefined}
        value={display}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (e.target.value === '' || Number.isNaN(v)) return;
          if (min !== undefined && v < min) return;
          onCommit(v);
        }}
        className="bg-transparent w-full text-right font-mono text-11 outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}

function weightLabel(w: number): string {
  if (w >= 700) return 'Bold';
  if (w >= 600) return 'Semi-Bold';
  if (w >= 500) return 'Medium';
  return 'Regular';
}

function variantToPatch(v: string): Partial<TextEl> {
  switch (v) {
    case 'Italic':
      return { fontStyle: 'italic' };
    case 'Bold':
      return { fontWeight: 700, fontStyle: 'normal' };
    case 'Semi-Bold':
      return { fontWeight: 600, fontStyle: 'normal' };
    case 'Medium':
      return { fontWeight: 500, fontStyle: 'normal' };
    default:
      return { fontWeight: 400, fontStyle: 'normal' };
  }
}

/**
 * Icono "justificar con última línea alineada a X". Dibuja 3 líneas
 * completas + 1 línea corta en la posición indicada.
 */
function JustifyLastIcon(lastLine: 'left' | 'center' | 'right') {
  return function Icon({ size = 13 }: { size?: number | string }) {
    const stroke = 'currentColor';
    const y = [3, 6.5, 10, 13.5];
    const fullX1 = 1.5;
    const fullX2 = 14.5;
    const shortLen = 7;
    const lastX1 =
      lastLine === 'left' ? fullX1 : lastLine === 'center' ? (16 - shortLen) / 2 : fullX2 - shortLen;
    const lastX2 = lastX1 + shortLen;
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <line x1={fullX1} y1={y[0]} x2={fullX2} y2={y[0]} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={fullX1} y1={y[1]} x2={fullX2} y2={y[1]} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={fullX1} y1={y[2]} x2={fullX2} y2={y[2]} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={lastX1} y1={y[3]} x2={lastX2} y2={y[3]} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    );
  };
}
