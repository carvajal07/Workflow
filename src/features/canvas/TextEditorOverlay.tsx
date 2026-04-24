import { useEffect, useRef } from 'react';
import type { TextEl } from '@/types/document';
import { MM_TO_PX, PT_PER_MM } from '@/utils/units';

interface Props {
  el: TextEl;
  zoom: number;
  offsetX: number;
  offsetY: number;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

export default function TextEditorOverlay({ el, zoom, offsetX, offsetY, onCommit, onCancel }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef(false);
  const s = MM_TO_PX * zoom;
  const fontPx = (el.fontSize / PT_PER_MM) * s;
  const minHeight = el.height * s;

  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    ta.select();
    autoResize(ta, minHeight);
  }, [minHeight]);

  function autoResize(ta: HTMLTextAreaElement, min: number) {
    ta.style.height = 'auto';
    ta.style.height = Math.max(min, ta.scrollHeight) + 'px';
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    autoResize(e.currentTarget, minHeight);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelRef.current = true;
      ref.current?.blur();
    }
  }

  function handleBlur() {
    if (cancelRef.current) {
      onCancel();
    } else {
      onCommit(ref.current?.value ?? el.text);
    }
  }

  const textAlign = el.align.startsWith('justify')
    ? 'left'
    : (el.align as 'left' | 'center' | 'right');

  return (
    <textarea
      ref={ref}
      defaultValue={el.text}
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        position: 'absolute',
        left: offsetX + el.x * s,
        top: offsetY + el.y * s,
        width: el.width * s,
        minHeight,
        fontFamily: el.fontFamily,
        fontSize: fontPx,
        fontStyle: el.fontStyle,
        fontWeight: el.fontWeight,
        color: el.color,
        lineHeight: el.lineHeight,
        textAlign,
        background: 'rgba(255,255,255,0.96)',
        border: '1.5px solid oklch(0.68 0.19 235)',
        borderRadius: 2,
        outline: 'none',
        resize: 'none',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        zIndex: 1000,
        transformOrigin: 'top left',
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }}
    />
  );
}
