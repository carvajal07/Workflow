import { useRef, useState } from 'react';
import { Database, RefreshCw, Upload, ChevronDown, ChevronRight, Link, LinkOff } from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { DataFieldEl } from '@/types/document';

/* ─── Tipos de valor JSON ─── */

type JsonType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

function jsonType(v: unknown): JsonType {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v as JsonType;
}

const TYPE_COLOR: Record<JsonType, { bg: string; text: string; label: string }> = {
  string:  { bg: '#1e3a5f', text: '#60a5fa', label: 'str' },
  number:  { bg: '#14402a', text: '#4ade80', label: 'num' },
  boolean: { bg: '#3b2000', text: '#fb923c', label: 'bool' },
  null:    { bg: '#2a2a2a', text: '#9ca3af', label: 'null' },
  object:  { bg: '#2d1f4e', text: '#c084fc', label: 'obj' },
  array:   { bg: '#1e2a4a', text: '#818cf8', label: 'arr' },
};

/* ─── Nodo recursivo del árbol ─── */

interface NodeProps {
  keyName: string;
  value: unknown;
  path: string;         // ruta dot-notation: "persona.nombre"
  depth: number;
  usedPaths: Set<string>;
  selectedDataFieldId: string | null;
  onBind: (path: string) => void;
}

function JsonNode({ keyName, value, path, depth, usedPaths, selectedDataFieldId, onBind }: NodeProps) {
  const type = jsonType(value);
  const isExpandable = type === 'object' || type === 'array';
  const [open, setOpen] = useState(depth < 2);

  const isUsed = usedPaths.has(path);
  const canBind = selectedDataFieldId !== null && !isExpandable;

  const entries: [string, unknown][] = isExpandable
    ? type === 'array'
      ? (value as unknown[]).map((v, i) => [String(i), v])
      : Object.entries(value as Record<string, unknown>)
    : [];

  const { bg, text, label } = TYPE_COLOR[type];

  const previewStr = !isExpandable
    ? type === 'string'
      ? `"${String(value).slice(0, 40)}${String(value).length > 40 ? '…' : ''}"`
      : String(value)
    : type === 'array'
      ? `[${(value as unknown[]).length}]`
      : `{${Object.keys(value as object).length}}`;

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : 12 }}>
      <div
        className="flex items-center h-[24px] gap-1 px-1 rounded group cursor-default select-none hover:bg-bg-3"
        style={{ minWidth: 0 }}
        onClick={() => {
          if (isExpandable) setOpen((o) => !o);
          else if (canBind) onBind(path);
        }}
        title={canBind ? `Vincular "${path}" al campo seleccionado` : path}
      >
        {/* Expand chevron */}
        <span className="w-3 shrink-0 flex items-center justify-center text-muted">
          {isExpandable
            ? open ? <ChevronDown size={9} /> : <ChevronRight size={9} />
            : null}
        </span>

        {/* Tipo badge */}
        <span
          className="shrink-0 rounded px-1 font-mono text-[9px] leading-none py-0.5"
          style={{ background: bg, color: text }}
        >
          {label}
        </span>

        {/* Key */}
        <span className="text-11 text-ink-2 shrink-0 font-mono">{keyName}</span>

        {/* Preview valor */}
        {!isExpandable && (
          <span className="text-11 text-muted truncate font-mono ml-0.5 min-w-0">
            {previewStr}
          </span>
        )}
        {isExpandable && (
          <span className="text-[10px] text-muted ml-0.5 shrink-0">{previewStr}</span>
        )}

        {/* Indicadores a la derecha */}
        <span className="ml-auto flex items-center gap-1 shrink-0">
          {isUsed && (
            <span title={`Vinculado en canvas (${path})`}>
              <Link size={10} style={{ color: 'var(--accent)' }} />
            </span>
          )}
          {canBind && !isUsed && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity" title="Click para vincular">
              <LinkOff size={10} className="text-muted" />
            </span>
          )}
        </span>
      </div>

      {/* Hijos */}
      {isExpandable && open && (
        <div style={{ borderLeft: '1px solid var(--line-2)', marginLeft: 6 }}>
          {entries.map(([k, v]) => (
            <JsonNode
              key={k}
              keyName={k}
              value={v}
              path={path ? `${path}.${k}` : k}
              depth={depth + 1}
              usedPaths={usedPaths}
              selectedDataFieldId={selectedDataFieldId}
              onBind={onBind}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Panel principal ─── */

export default function DataPanel() {
  const jsonData     = useDocumentStore((s) => s.jsonData);
  const jsonFileName = useDocumentStore((s) => s.jsonFileName);
  const setJsonData  = useDocumentStore((s) => s.setJsonData);
  const pages        = useDocumentStore((s) => s.doc.pages);
  const updateElement = useDocumentStore((s) => s.updateElement);
  const selectedIds  = useSelectionStore((s) => s.selectedIds);
  const fileRef      = useRef<HTMLInputElement>(null);

  /* Campo seleccionado (solo si es dataField único) */
  const selectedDataField: DataFieldEl | null = (() => {
    if (selectedIds.length !== 1) return null;
    const el = pages.flatMap((p) => p.elements).find((e) => e.id === selectedIds[0]);
    return el?.type === 'dataField' ? (el as DataFieldEl) : null;
  })();

  /* Rutas actualmente usadas en el canvas */
  const usedPaths = new Set(
    pages.flatMap((p) =>
      p.elements
        .filter((e) => e.type === 'dataField')
        .map((e) => (e as DataFieldEl).binding)
        .filter(Boolean),
    ),
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setJsonData(parsed, file.name);
      } catch {
        alert('El archivo no es un JSON válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleBind(path: string) {
    if (selectedDataField) {
      updateElement(selectedDataField.id, { binding: path } as Partial<DataFieldEl>);
    }
  }

  /* Normaliza: si el JSON es un array toma el primer elemento como muestra */
  const rootEntries: [string, unknown][] = (() => {
    if (jsonData === null) return [];
    if (Array.isArray(jsonData)) {
      const first = (jsonData as unknown[])[0];
      if (first && typeof first === 'object' && !Array.isArray(first))
        return Object.entries(first as Record<string, unknown>);
      return (jsonData as unknown[]).map((v, i) => [String(i), v]);
    }
    if (typeof jsonData === 'object')
      return Object.entries(jsonData as Record<string, unknown>);
    return [];
  })();

  const isArray = Array.isArray(jsonData);
  const totalRows = isArray ? (jsonData as unknown[]).length : null;

  return (
    <div className="h-full flex flex-col">

      {/* ── Cabecera de fuente ── */}
      <div
        className="shrink-0 px-3 py-2 flex flex-col gap-2"
        style={{ borderBottom: '1px solid var(--line-2)' }}
      >
        {jsonData ? (
          <>
            <div className="flex items-center gap-2">
              <Database size={13} style={{ color: 'var(--accent)', shrink: 0 }} />
              <span className="text-11 font-semibold text-ink truncate flex-1" title={jsonFileName ?? ''}>
                {jsonFileName ?? 'datos.json'}
              </span>
              <button
                type="button"
                title="Cargar otro JSON"
                onClick={() => fileRef.current?.click()}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-bg-3 text-muted shrink-0"
              >
                <RefreshCw size={12} />
              </button>
            </div>
            {totalRows !== null && (
              <span className="text-[10px] text-muted">
                Array · {totalRows} {totalRows === 1 ? 'registro' : 'registros'} · mostrando estructura del primero
              </span>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <Database size={24} className="text-muted" />
            <span className="text-11 text-muted text-center">
              Carga un archivo JSON para<br />mapear datos variables
            </span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 h-7 px-3 rounded text-11 font-semibold flex items-center gap-1.5"
              style={{ background: 'var(--accent)', color: '#0b1a10' }}
            >
              <Upload size={12} />
              Cargar JSON
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* ── Hint contextual ── */}
      {jsonData && (
        <div
          className="shrink-0 px-3 py-1.5 text-[10px]"
          style={{ borderBottom: '1px solid var(--line-2)', background: 'var(--bg-2)' }}
        >
          {selectedDataField
            ? <>
                <span style={{ color: 'var(--accent)' }}>● </span>
                Campo <strong className="text-ink">{selectedDataField.binding || 'sin binding'}</strong> seleccionado —
                haz clic en un campo de texto para vincularlo
              </>
            : <span className="text-muted">
                Selecciona un elemento «Campo de datos» en el canvas para vincular campos
              </span>}
        </div>
      )}

      {/* ── Árbol JSON ── */}
      {jsonData && (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {rootEntries.map(([k, v]) => (
            <JsonNode
              key={k}
              keyName={k}
              value={v}
              path={k}
              depth={0}
              usedPaths={usedPaths}
              selectedDataFieldId={selectedDataField?.id ?? null}
              onBind={handleBind}
            />
          ))}
        </div>
      )}

      {/* ── Leyenda ── */}
      {jsonData && (
        <div
          className="shrink-0 px-3 py-2 flex flex-wrap gap-x-3 gap-y-1"
          style={{ borderTop: '1px solid var(--line-2)' }}
        >
          {Object.entries(TYPE_COLOR).map(([type, { bg, text, label }]) => (
            <span key={type} className="flex items-center gap-1 text-[9px]">
              <span className="rounded px-1 py-0.5 font-mono" style={{ background: bg, color: text }}>{label}</span>
              <span className="text-muted">{type}</span>
            </span>
          ))}
          <span className="flex items-center gap-1 text-[9px] text-muted">
            <Link size={9} style={{ color: 'var(--accent)' }} /> en uso
          </span>
        </div>
      )}
    </div>
  );
}
