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
  // Prevent double-commit when both mousedown listener and blur fire
  const doneRef = useRef(false);
  const cancelRef = useRef(false);
  // Keep latest callbacks stable inside the mount-time effect closure
  const onCommitRef = useRef(onCommit);
  const onCancelRef = useRef(onCancel);
  const elTextRef = useRef(el.text);
  useEffect(() => { onCommitRef.current = onCommit; }, [onCommit]);
  useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);
  useEffect(() => { elTextRef.current = el.text; }, [el.text]);

  const s = MM_TO_PX * zoom;
  const fontPx = (el.fontSize / PT_PER_MM) * s;
  const minHeight = el.height * s;

  function commit() {
    if (doneRef.current) return;
    doneRef.current = true;
    onCommitRef.current(ref.current?.value ?? elTextRef.current);
  }

  function cancel() {
    if (doneRef.current) return;
    doneRef.current = true;
    onCancelRef.current();
  }

  // On mount: focus + outside-click listener.
  // The Konva <canvas> has no tabIndex so clicking on it does NOT fire blur
  // on the textarea. The document mousedown (capture) is the reliable trigger.
  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    ta.select();
    autoResize(ta, ta.offsetHeight);

    function handleOutsideMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (cancelRef.current) {
          cancel();
        } else {
          commit();
        }
      }
    }

    document.addEventListener('mousedown', handleOutsideMouseDown, true);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-size overlay when zoom changes
  useEffect(() => {
    if (ref.current) autoResize(ref.current, minHeight);
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
      cancel();
    }
  }

  // Fallback for tab-away or programmatic blur (mousedown listener handles clicks)
  function handleBlur() {
    if (cancelRef.current) {
      cancel();
    } else {
      commit();
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
