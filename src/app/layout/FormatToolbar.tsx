import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

function Sep() {
  return <div className="w-px h-5 bg-line-2 mx-1.5" />;
}

function Toggle({
  icon: Icon,
  active = false,
  label,
}: {
  icon: typeof Bold;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="w-[22px] h-[22px] flex items-center justify-center rounded-3 text-ink-2 hover:bg-bg-3 hover:text-ink"
      style={
        active
          ? { background: 'var(--bg-4)', color: 'var(--accent)' }
          : undefined
      }
    >
      <Icon size={13} />
    </button>
  );
}

function NumberField({ value, width = 54, unit }: { value: number; width?: number; unit?: string }) {
  return (
    <div
      className="h-[22px] flex items-center bg-bg-3 border border-line-2 rounded-3 px-1.5"
      style={{ width }}
    >
      <input
        className="bg-transparent w-full text-right font-mono text-11 outline-none"
        defaultValue={value}
      />
      {unit && <span className="text-muted text-11 ml-1">{unit}</span>}
    </div>
  );
}

function Select({ width, options }: { width: number; options: string[] }) {
  return (
    <select
      className="h-[22px] bg-bg-3 border border-line-2 rounded-3 text-11 px-1.5 outline-none"
      style={{ width }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function FormatToolbar() {
  return (
    <div className="h-full bg-bg-1 flex items-center px-2 gap-1.5 text-11">
      {/* Grupo 1: Fuente */}
      <Select width={130} options={['Inter', 'JetBrains Mono', 'Arial', 'Helvetica']} />
      <Select width={86} options={['Regular', 'Medium', 'Bold', 'Italic']} />
      <NumberField value={10} width={54} />
      <Select width={48} options={['pt', 'px', 'mm']} />
      <Sep />

      {/* Grupo 2: Estilo */}
      <Toggle icon={Bold} label="Bold" />
      <Toggle icon={Italic} label="Itálica" />
      <Toggle icon={Underline} label="Subrayado" />
      <Toggle icon={Strikethrough} label="Tachado" />
      <button
        type="button"
        className="w-[22px] h-[22px] rounded-3 border border-line-2"
        style={{ background: '#000' }}
        title="Color"
      />
      <Sep />

      {/* Grupo 3: Alineación */}
      <Toggle icon={AlignLeft} label="Alinear izquierda" active />
      <Toggle icon={AlignCenter} label="Centrar" />
      <Toggle icon={AlignRight} label="Alinear derecha" />
      <Sep />

      {/* Grupo 4: Justificación */}
      <Toggle icon={AlignJustify} label="Justificar" />
      <Sep />

      {/* Grupo 5: Estilo de párrafo */}
      <div className="ml-auto">
        <Select width={150} options={['Normal', 'Título 1', 'Título 2', 'Cita']} />
      </div>
    </div>
  );
}
