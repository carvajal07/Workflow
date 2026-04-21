import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { TableEl } from '@/types/document';
import { MM_TO_PX } from '@/utils/units';

interface Props {
  el: TableEl;
  zoom: number;
  onSelect: (id: string, additive: boolean) => void;
  onChange: (patch: Partial<TableEl>) => void;
  draggable: boolean;
}

/**
 * Tabla con bordes uniformes y alturas de fila equitativas. Los anchos de
 * columna vienen en porcentaje y se normalizan al `el.width`.
 */
export default function TableElement({ el, zoom, onSelect, onChange, draggable }: Props) {
  const s = MM_TO_PX * zoom;
  const totalWPx = el.width * s;
  const totalHPx = el.height * s;
  const rows = el.rows;
  const rowCount = Math.max(1, rows.length);
  const rowHPx = totalHPx / rowCount;

  // Normaliza porcentajes para que sumen 100
  const sumPct = el.columns.reduce((acc, c) => acc + (c.widthPercent || 0), 0) || 1;
  const colWidthsPx = el.columns.map((c) => (c.widthPercent / sumPct) * totalWPx);

  // Posición X acumulada de cada columna
  const colXPx: number[] = [];
  colWidthsPx.reduce((acc, w) => {
    colXPx.push(acc);
    return acc + w;
  }, 0);

  const border = el.borderColor || '#444';
  const borderW = Math.max(0.5, el.borderWidth * s);
  const pad = Math.max(2, el.cellSpacing * s);

  return (
    <Group
      id={el.id}
      name="pdfsketch-element"
      x={el.x * s}
      y={el.y * s}
      rotation={el.rotation}
      visible={el.visible}
      draggable={draggable && !el.locked}
      onMouseDown={(e) => onSelect(el.id, e.evt.shiftKey)}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onChange({ x: node.x() / s, y: node.y() / s });
      }}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Group;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x() / s,
          y: node.y() / s,
          width: Math.max(5, el.width * scaleX),
          height: Math.max(5, el.height * scaleY),
          rotation: node.rotation(),
        });
      }}
    >
      {/* Borde exterior */}
      <Rect
        x={0}
        y={0}
        width={totalWPx}
        height={totalHPx}
        fill="transparent"
        stroke={border}
        strokeWidth={borderW}
      />

      {rows.map((row, ri) =>
        row.map((cell, ci) => {
          const cx = colXPx[ci] ?? 0;
          const cw = colWidthsPx[ci] ?? 0;
          const cy = ri * rowHPx;
          return (
            <Group key={`${ri}-${ci}`} x={cx} y={cy}>
              <Rect
                width={cw}
                height={rowHPx}
                fill="transparent"
                stroke={border}
                strokeWidth={borderW}
              />
              <Text
                x={pad}
                y={pad}
                width={Math.max(0, cw - pad * 2)}
                height={Math.max(0, rowHPx - pad * 2)}
                text={cell.text ?? ''}
                fontSize={Math.min(12, rowHPx * 0.5)}
                fontFamily="Inter, system-ui, sans-serif"
                fill="#111"
                align={cell.align ?? 'left'}
                verticalAlign="middle"
                wrap="word"
              />
            </Group>
          );
        }),
      )}
    </Group>
  );
}
