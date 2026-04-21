import { Rect, Group } from 'react-konva';
import type { Page } from '@/types/document';
import { MM_TO_PX } from '@/utils/units';

interface Props {
  page: Page;
  zoom: number;
  /** offset del Stage (pan). */
  offsetX: number;
  offsetY: number;
}

/**
 * Hoja blanca del documento con sombra y margen guía dashed.
 * Renderiza tanto la sombra (fuera de la hoja) como la zona de margen interior.
 * El tamaño en px se calcula con MM_TO_PX * zoom.
 */
export default function Sheet({ page, zoom, offsetX, offsetY }: Props) {
  const w = page.size.width * MM_TO_PX * zoom;
  const h = page.size.height * MM_TO_PX * zoom;
  const mTop = page.margin.top * MM_TO_PX * zoom;
  const mRight = page.margin.right * MM_TO_PX * zoom;
  const mBottom = page.margin.bottom * MM_TO_PX * zoom;
  const mLeft = page.margin.left * MM_TO_PX * zoom;

  return (
    <Group x={offsetX} y={offsetY}>
      {/* sombra simulada con un rect más oscuro detrás */}
      <Rect
        x={4}
        y={6}
        width={w}
        height={h}
        fill="rgba(0,0,0,0.45)"
        cornerRadius={0}
        listening={false}
      />
      {/* hoja */}
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill={page.background || '#fbfbf8'}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={1}
      />
      {/* margen guía (dashed, verde del accent) */}
      <Rect
        x={mLeft}
        y={mTop}
        width={Math.max(0, w - mLeft - mRight)}
        height={Math.max(0, h - mTop - mBottom)}
        stroke="oklch(0.72 0.15 150 / 0.55)"
        strokeWidth={1}
        dash={[4, 4]}
        listening={false}
      />
    </Group>
  );
}
