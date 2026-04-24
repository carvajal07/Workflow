import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextEl } from '@/types/document';
import { MM_TO_PX, PT_PER_MM } from '@/utils/units';

interface Props {
  el: TextEl;
  zoom: number;
  onSelect: (id: string, additive: boolean) => void;
  onChange: (patch: Partial<TextEl>) => void;
  draggable: boolean;
}

export default function TextElement({ el, zoom, onSelect, onChange, draggable }: Props) {
  const s = MM_TO_PX * zoom;
  // fontSize vive en pt → mm → px.
  const fontPx = (el.fontSize / PT_PER_MM) * s;
  const weight = el.fontWeight >= 600 ? 'bold' : 'normal';
  const italic = el.fontStyle === 'italic' ? 'italic' : '';
  const konvaFontStyle = [weight, italic].filter(Boolean).join(' ') || 'normal';

  return (
    <Text
      id={el.id}
      name="pdfsketch-element"
      x={el.x * s}
      y={el.y * s}
      width={el.width * s}
      height={el.height * s}
      text={el.text || ' '}
      fontFamily={el.fontFamily}
      fontSize={fontPx}
      fontStyle={konvaFontStyle}
      textDecoration={el.textDecoration}
      align={el.align.startsWith('justify') ? 'left' : (el.align as 'left' | 'center' | 'right')}
      lineHeight={el.lineHeight}
      fill={el.color}
      rotation={el.rotation}
      visible={el.visible}
      wrap="word"
      draggable={draggable && !el.locked}
      onMouseDown={(e) => onSelect(el.id, e.evt.shiftKey)}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onChange({ x: node.x() / s, y: node.y() / s });
      }}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Text;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x() / s,
          y: node.y() / s,
          width: Math.max(5, (node.width() * scaleX) / s),
          height: Math.max(3, (node.height() * scaleY) / s),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
