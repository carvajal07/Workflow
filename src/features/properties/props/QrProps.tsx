import { useDocumentStore } from '@/store/documentStore';
import type { QrEl } from '@/types/document';
import { SectionTitle, Row, TextInput, SelectInput, NumberInput } from '../shared';

interface Props {
  el: QrEl;
}

const ERROR_LEVELS: { value: QrEl['errorLevel']; label: string }[] = [
  { value: 'L', label: 'L — Bajo (7%)' },
  { value: 'M', label: 'M — Medio (15%)' },
  { value: 'Q', label: 'Q — Cuartil (25%)' },
  { value: 'H', label: 'H — Alto (30%)' },
];

export default function QrProps({ el }: Props) {
  const updateElement = useDocumentStore((s) => s.updateElement);
  const up = (patch: Partial<QrEl>) => updateElement(el.id, patch);

  return (
    <>
      <SectionTitle>Código QR</SectionTitle>

      <Row label="Datos">
        <TextInput value={el.data} onChange={(v) => up({ data: v })} placeholder="https://…" />
      </Row>

      <Row label="Variable">
        <TextInput value={el.variable ?? ''} onChange={(v) => up({ variable: v || undefined })} placeholder="(ninguna)" />
      </Row>

      <Row label="Corrección">
        <SelectInput
          value={el.errorLevel}
          onChange={(v) => up({ errorLevel: v })}
          options={ERROR_LEVELS}
        />
      </Row>

      <Row label="Módulo">
        <NumberInput
          value={el.moduleSize}
          onChange={(v) => up({ moduleSize: v })}
          min={0.1}
          step={0.1}
          unit="mm"
        />
      </Row>
    </>
  );
}
