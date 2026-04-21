import { Line } from 'react-konva';
import type Konva from 'konva';
import type { LineEl, PenEl } from '@/types/document';
import { MM_TO_PX } from '@/utils/units';

interface Props<T extends LineEl | PenEl> {
  el: T;
  zoom: number;
  onSelect: (id: string, additive: boolean) => void;
  onChange: (patch: Partial<T>) => void;
  draggable: boolean;
}

/** Renderiza tanto `LineEl` (tension 0) como `PenEl` (tension > 0). */
export default function LineLikeElement<T extends LineEl | PenEl>({
  el,
  zoom,
  onSelect,
  onChange,
  draggable,
}: Props<T>) {
  const s = MM_TO_PX * zoom;
  const pointsPx = el.points.map((v) => v * s);
  const tension = (el as PenEl).tension ?? 0;

  return (
    <Line
      id={el.id}
      name="pdfsketch-element"
      x={el.x * s}
      y={el.y * s}
      points={pointsPx}
      rotation={el.rotation}
      stroke={el.stroke}
      strokeWidth={Math.max(1, el.strokeWidth * s)}
      tension={tension}
      dash={el.type === 'line' ? (el as LineEl).dash : undefined}
      visible={el.visible}
      lineCap="round"
      lineJoin="round"
      draggable={draggable && !el.locked}
      hitStrokeWidth={Math.max(6, el.strokeWidth * s + 4)}
      onMouseDown={(e) => onSelect(el.id, e.evt.shiftKey)}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onChange({ x: node.x() / s, y: node.y() / s } as Partial<T>);
      }}
    />
  );
}
