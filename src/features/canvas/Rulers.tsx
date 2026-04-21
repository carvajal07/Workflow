import { Group, Line, Rect, Text } from 'react-konva';

interface Props {
  /** Ancho del viewport del canvas (px). */
  viewportWidth: number;
  /** Alto del viewport del canvas (px). */
  viewportHeight: number;
  /** Offset del "origen" (0,0) de la hoja en el viewport. */
  originX: number;
  originY: number;
  /** Zoom actual, para ajustar la densidad de ticks. */
  zoom: number;
}

const RULER_SIZE = 20;
const TICK_COLOR = '#7d7d82';
const BG = '#26262a';

/**
 * Reglas horizontal y vertical en mm (visualizadas en px).
 * Se dibujan ticks cada 20px y labels cada 100px, como especifica el README.
 */
export default function Rulers({
  viewportWidth,
  viewportHeight,
  originX,
  originY,
  zoom,
}: Props) {
  const tickEvery = 20;
  const labelEvery = 100;
  const stepPx = Math.max(5, tickEvery * zoom);

  // ticks horizontal (eje X)
  const hTicks: JSX.Element[] = [];
  for (let x = 0; x < viewportWidth; x += stepPx) {
    const px = (x + (originX % stepPx)) | 0;
    const isLabel = Math.round((px - originX) / zoom) % labelEvery === 0;
    hTicks.push(
      <Line
        key={`h-${x}`}
        points={[px, isLabel ? 6 : 12, px, RULER_SIZE]}
        stroke={TICK_COLOR}
        strokeWidth={1}
        listening={false}
      />,
    );
    if (isLabel) {
      const labelValue = Math.round((px - originX) / zoom);
      hTicks.push(
        <Text
          key={`hl-${x}`}
          x={px + 2}
          y={2}
          text={String(labelValue)}
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill={TICK_COLOR}
          listening={false}
        />,
      );
    }
  }

  // ticks vertical (eje Y)
  const vTicks: JSX.Element[] = [];
  for (let y = 0; y < viewportHeight; y += stepPx) {
    const py = (y + (originY % stepPx)) | 0;
    const isLabel = Math.round((py - originY) / zoom) % labelEvery === 0;
    vTicks.push(
      <Line
        key={`v-${y}`}
        points={[isLabel ? 6 : 12, py, RULER_SIZE, py]}
        stroke={TICK_COLOR}
        strokeWidth={1}
        listening={false}
      />,
    );
    if (isLabel) {
      const labelValue = Math.round((py - originY) / zoom);
      vTicks.push(
        <Text
          key={`vl-${y}`}
          x={2}
          y={py + 2}
          text={String(labelValue)}
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill={TICK_COLOR}
          listening={false}
        />,
      );
    }
  }

  return (
    <Group listening={false}>
      {/* esquina */}
      <Rect x={0} y={0} width={RULER_SIZE} height={RULER_SIZE} fill={BG} />
      {/* ruler horizontal */}
      <Rect x={RULER_SIZE} y={0} width={viewportWidth - RULER_SIZE} height={RULER_SIZE} fill={BG} />
      <Group x={RULER_SIZE} y={0}>
        {hTicks}
      </Group>
      {/* ruler vertical */}
      <Rect x={0} y={RULER_SIZE} width={RULER_SIZE} height={viewportHeight - RULER_SIZE} fill={BG} />
      <Group x={0} y={RULER_SIZE}>
        {vTicks}
      </Group>
      {/* bordes */}
      <Line
        points={[0, RULER_SIZE + 0.5, viewportWidth, RULER_SIZE + 0.5]}
        stroke="#1a1a1c"
        strokeWidth={1}
      />
      <Line
        points={[RULER_SIZE + 0.5, 0, RULER_SIZE + 0.5, viewportHeight]}
        stroke="#1a1a1c"
        strokeWidth={1}
      />
    </Group>
  );
}

export const RULER_SIZE_PX = RULER_SIZE;
