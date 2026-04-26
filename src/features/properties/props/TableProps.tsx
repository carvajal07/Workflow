import { useDocumentStore } from '@/store/documentStore';
import type { TableEl } from '@/types/document';
import { SectionTitle, Row, ColorInput, NumberInput } from '../shared';

interface Props {
  el: TableEl;
}

export default function TableProps({ el }: Props) {
  const updateElement = useDocumentStore((s) => s.updateElement);
  const up = (patch: Partial<TableEl>) => updateElement(el.id, patch);

  return (
    <>
      <SectionTitle>Tabla</SectionTitle>

      <Row label="Borde">
        <NumberInput
          value={el.borderWidth}
          onChange={(v) => up({ borderWidth: v })}
          min={0}
          step={0.1}
          unit="mm"
        />
      </Row>

      <Row label="Color borde">
        <ColorInput value={el.borderColor} onChange={(v) => up({ borderColor: v })} />
      </Row>

      <Row label="Espaciado">
        <NumberInput
          value={el.cellSpacing}
          onChange={(v) => up({ cellSpacing: v })}
          min={0}
          step={0.1}
          unit="mm"
        />
      </Row>

      <div className="mt-1 text-[10px] text-muted">
        {el.rows.length} fila(s) · {el.columns.length} columna(s)
      </div>
    </>
  );
}
