import { useMemo } from 'react';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { BaseEl, ElementModel } from '@/types/document';
import { SectionTitle, NumberInput, round } from './shared';
import ShapeProps from './props/ShapeProps';
import TextProps from './props/TextProps';
import ImageProps from './props/ImageProps';
import LineProps from './props/LineProps';
import QrProps from './props/QrProps';
import DataFieldProps from './props/DataFieldProps';
import TableProps from './props/TableProps';
import FrameProps from './props/FrameProps';
import FlowableProps from './props/FlowableProps';

type NumKey = 'x' | 'y' | 'width' | 'height' | 'rotation';
type BoolKey = 'visible' | 'locked';

/**
 * Panel de propiedades contextual. Muestra secciones base (posición,
 * estado) siempre, y una sección específica según el tipo del elemento.
 * Con multi-selección de tipos distintos, solo muestra la sección base.
 */
export default function ElementProps() {
  const pages = useDocumentStore((s) => s.doc.pages);
  const updateElement = useDocumentStore((s) => s.updateElement);
  const selectedIds = useSelectionStore((s) => s.selectedIds);

  const selected = useMemo<ElementModel[]>(() => {
    if (selectedIds.length === 0) return [];
    const idSet = new Set(selectedIds);
    return pages.flatMap((p) => p.elements).filter((e) => idSet.has(e.id));
  }, [pages, selectedIds]);

  if (selected.length === 0) return null;

  const commonNum = (k: NumKey): number | undefined => {
    const first = selected[0][k];
    return selected.every((e) => e[k] === first) ? first : undefined;
  };
  const commonBool = (k: BoolKey): boolean | undefined => {
    const first = selected[0][k];
    return selected.every((e) => e[k] === first) ? first : undefined;
  };
  const applyNum = (k: NumKey, v: number) => {
    for (const el of selected) updateElement(el.id, { [k]: v } as Partial<BaseEl>);
  };
  const applyBool = (k: BoolKey, v: boolean) => {
    for (const el of selected) updateElement(el.id, { [k]: v } as Partial<BaseEl>);
  };

  const allSameType = selected.every((e) => e.type === selected[0].type);
  const singleEl = selected.length === 1 ? selected[0] : null;
  const typeEl = allSameType ? selected[0] : null;

  return (
    <div className="flex flex-col gap-1.5">

      {/* ── Posición y tamaño ── */}
      <SectionTitle>Posición y tamaño</SectionTitle>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        <NumberField label="X" unit="mm" value={commonNum('x')} onCommit={(v) => applyNum('x', v)} />
        <NumberField label="Y" unit="mm" value={commonNum('y')} onCommit={(v) => applyNum('y', v)} />
        <NumberField label="Ancho" unit="mm" min={0.5} value={commonNum('width')} onCommit={(v) => applyNum('width', v)} />
        <NumberField label="Alto" unit="mm" min={0.5} value={commonNum('height')} onCommit={(v) => applyNum('height', v)} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-ink-2 shrink-0 text-[10px] w-[52px] text-right">Rotación</span>
        <NumberInput
          value={commonNum('rotation')}
          onChange={(v) => applyNum('rotation', v)}
          step={1}
          unit="°"
        />
      </div>

      {/* ── Propiedades específicas del tipo ── */}
      {singleEl && typeEl && renderTypeProps(typeEl)}

      {/* ── Estado ── */}
      <SectionTitle>Estado</SectionTitle>
      <div className="flex gap-2">
        <ToggleBtn
          label={commonBool('visible') === false ? 'Oculto' : 'Visible'}
          icon={commonBool('visible') === false ? EyeOff : Eye}
          active={commonBool('visible') !== false}
          mixed={commonBool('visible') === undefined}
          onClick={() => applyBool('visible', !(commonBool('visible') ?? true))}
        />
        <ToggleBtn
          label={commonBool('locked') ? 'Bloqueado' : 'Libre'}
          icon={commonBool('locked') ? Lock : Unlock}
          active={commonBool('locked') === true}
          mixed={commonBool('locked') === undefined}
          onClick={() => applyBool('locked', !(commonBool('locked') ?? false))}
        />
      </div>
    </div>
  );
}

function renderTypeProps(el: ElementModel) {
  switch (el.type) {
    case 'rect':
    case 'circle':
      return <ShapeProps el={el} />;
    case 'text':
      return <TextProps el={el} />;
    case 'image':
      return <ImageProps el={el} />;
    case 'line':
    case 'pen':
      return <LineProps el={el} />;
    case 'qr':
      return <QrProps el={el} />;
    case 'dataField':
      return <DataFieldProps el={el} />;
    case 'table':
      return <TableProps el={el} />;
    case 'frame':
      return <FrameProps el={el} />;
    case 'flowable':
      return <FlowableProps el={el} />;
    default:
      return null;
  }
}

/* ─── Helpers locales ─── */

function NumberField({
  label, unit, value, onCommit, step = 0.1, min,
}: {
  label: string; unit?: string; value: number | undefined;
  onCommit: (v: number) => void; step?: number; min?: number;
}) {
  const display = value === undefined ? '' : round(value).toString();
  return (
    <label className="flex items-center gap-2">
      <span className="text-ink-2 w-10 text-[10px]">{label}</span>
      <div className="h-[22px] flex items-center bg-bg-3 border border-line-2 rounded-3 px-1.5 flex-1">
        <input
          type="number"
          step={step}
          {...(min !== undefined ? { min } : {})}
          className="bg-transparent w-full text-right font-mono text-11 outline-none"
          placeholder={value === undefined ? '—' : undefined}
          value={display}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (e.target.value === '' || Number.isNaN(v)) return;
            if (min !== undefined && v < min) return;
            onCommit(v);
          }}
        />
        {unit && <span className="text-muted text-[10px] ml-1">{unit}</span>}
      </div>
    </label>
  );
}

function ToggleBtn({
  label, icon: Icon, active, mixed, onClick,
}: {
  label: string; icon: typeof Eye; active: boolean; mixed: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[24px] px-2 flex items-center gap-1.5 rounded-3 border border-line-2 hover:bg-bg-3 flex-1"
      style={
        active
          ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
          : mixed
            ? { color: 'var(--muted)' }
            : { color: 'var(--ink-2)' }
      }
      title={mixed ? `${label} (valores mixtos)` : label}
    >
      <Icon size={12} />
      <span className="text-11">{mixed ? '—' : label}</span>
    </button>
  );
}
