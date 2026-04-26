import { useEffect, useState } from 'react';
import { Group, Image as KImage, Rect, Text } from 'react-konva';
import QRCode from 'qrcode';
import type Konva from 'konva';
import type { QrEl } from '@/types/document';
import { MM_TO_PX } from '@/utils/units';
import { useHtmlImage } from './useHtmlImage';

interface Props {
  el: QrEl;
  zoom: number;
  onSelect: (id: string, additive: boolean) => void;
  onChange: (patch: Partial<QrEl>) => void;
  draggable: boolean;
}

/**
 * QR generado en cliente con `qrcode`. Si `variable` está definida y no hay `data`,
 * muestra el placeholder `{{variable}}` para indicar que es dinámico.
 */
export default function QrElement({ el, zoom, onSelect, onChange, draggable }: Props) {
  const s = MM_TO_PX * zoom;
  const side = Math.min(el.width, el.height) * s;

  const rawContent =
    el.data?.trim() || (el.variable ? `{{${el.variable}}}` : '');
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!rawContent) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(rawContent, {
      errorCorrectionLevel: el.errorLevel,
      margin: 0,
      width: 512,
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [rawContent, el.errorLevel]);

  const { image } = useHtmlImage(dataUrl);

  return (
    <Group
      id={el.id}
      name="pdfsketch-element"
      x={el.x * s}
      y={el.y * s}
      rotation={el.rotation}
      visible={el.visible}
      draggable={draggable && !el.locked}
      onMouseDown={(e) => onSelect(el.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)}
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
        // QR se mantiene cuadrado: usar la escala más pequeña
        const scale = Math.min(scaleX, scaleY);
        const size = Math.max(1, Math.min(el.width, el.height) * scale);
        onChange({
          x: node.x() / s,
          y: node.y() / s,
          width: size,
          height: size,
          rotation: node.rotation(),
        });
      }}
    >
      {image ? (
        <KImage image={image} width={side} height={side} />
      ) : (
        <>
          <Rect
            width={side}
            height={side}
            fill="#fff"
            stroke="#bbb"
            strokeWidth={1}
            dash={[3, 3]}
          />
          <Text
            width={side}
            height={side}
            text={rawContent ? 'QR' : 'Sin datos'}
            fontSize={Math.min(12, side / 4)}
            fill="#666"
            align="center"
            verticalAlign="middle"
          />
        </>
      )}
    </Group>
  );
}
