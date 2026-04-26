import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import type Konva from 'konva';
import Sheet from './Sheet';
import Rulers, { RULER_SIZE_PX } from './Rulers';
import ElementsLayer from './ElementsLayer';
import DraftOverlay from './DraftOverlay';
import SelectionTransformer from './SelectionTransformer';
import TextEditorOverlay from './TextEditorOverlay';
import { useCanvasDraw } from './useCanvasDraw';
import { useDocumentStore } from '@/store/documentStore';
import { useUIStore } from '@/store/uiStore';
import { useToolStore } from '@/store/toolStore';
import { useSelectionStore } from '@/store/selectionStore';
import { MM_TO_PX, pxToMm } from '@/utils/units';
import type { TextEl } from '@/types/document';

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);
  const setCursor = useUIStore((s) => s.setCursor);
  const activeTool = useToolStore((s) => s.active);
  const clearSelection = useSelectionStore((s) => s.clear);
  const editingId = useSelectionStore((s) => s.editingId);
  const setEditing = useSelectionStore((s) => s.setEditing);

  const pages = useDocumentStore((s) => s.doc.pages);
  const currentPageId = useDocumentStore((s) => s.currentPageId);
  const updateElement = useDocumentStore((s) => s.updateElement);
  const removeElements = useDocumentStore((s) => s.removeElements);
  const page = pages.find((p) => p.id === currentPageId) ?? pages[0];

  const editingEl = editingId
    ? (page?.elements.find((e) => e.id === editingId && e.type === 'text') as TextEl | undefined)
    : undefined;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  const panningRef = useRef(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // marquee selection
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const marqueeRef = useRef<typeof marquee>(null);

  // siguiente zIndex a asignar a un nuevo elemento
  const nextZIndex = useMemo(
    () => () => (page ? Math.max(0, ...page.elements.map((e) => e.zIndex)) + 1 : 0),
    [page],
  );

  const draw = useCanvasDraw({
    offsetX: offset.x,
    offsetY: offset.y,
    zoom,
    pageId: page?.id ?? '',
    nextZIndex,
  });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!page) return;
    const sheetW = page.size.width * MM_TO_PX * zoom;
    const sheetH = page.size.height * MM_TO_PX * zoom;
    const cx = RULER_SIZE_PX + Math.max(0, (size.w - RULER_SIZE_PX - sheetW) / 2);
    const cy = RULER_SIZE_PX + Math.max(0, (size.h - RULER_SIZE_PX - sheetH) / 2);
    setOffset({ x: cx, y: cy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id, size.w, size.h]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSpaceDown(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = useSelectionStore.getState().selectedIds;
        if (ids.length > 0) {
          useDocumentStore.getState().removeElements(ids);
          useSelectionStore.getState().clear();
        }
      } else if (e.key === '0') {
        fitToViewport();
      } else if (e.key === '1') {
        setZoom(1);
      } else if (e.key === 'Escape') {
        draw.cancel();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setZoom, draw.cancel]);

  function fitToViewport() {
    if (!page) return;
    const margin = 40;
    const availW = Math.max(100, size.w - RULER_SIZE_PX - margin * 2);
    const availH = Math.max(100, size.h - RULER_SIZE_PX - margin * 2);
    const z = Math.min(
      availW / (page.size.width * MM_TO_PX),
      availH / (page.size.height * MM_TO_PX),
    );
    setZoom(z);
    const sheetW = page.size.width * MM_TO_PX * z;
    const sheetH = page.size.height * MM_TO_PX * z;
    setOffset({
      x: RULER_SIZE_PX + (size.w - RULER_SIZE_PX - sheetW) / 2,
      y: RULER_SIZE_PX + (size.h - RULER_SIZE_PX - sheetH) / 2,
    });
  }

  function onWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    const native = e.evt;
    if (!(native.ctrlKey || native.metaKey)) {
      native.preventDefault();
      setOffset((o) => ({ x: o.x - native.deltaX, y: o.y - native.deltaY }));
      return;
    }
    native.preventDefault();
    const scaleBy = 1.08;
    const direction = native.deltaY > 0 ? -1 : 1;
    const nextZoom = Math.max(
      0.1,
      Math.min(5, zoom * (direction > 0 ? scaleBy : 1 / scaleBy)),
    );
    const stage = stageRef.current;
    if (!stage) {
      setZoom(nextZoom);
      return;
    }
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      setZoom(nextZoom);
      return;
    }
    const mx = (pointer.x - offset.x) / zoom;
    const my = (pointer.y - offset.y) / zoom;
    const nx = pointer.x - mx * nextZoom;
    const ny = pointer.y - my * nextZoom;
    setZoom(nextZoom);
    setOffset({ x: nx, y: ny });
  }

  const isHand = activeTool === 'hand' || spaceDown;

  function stagePosPx(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    const p = stage?.getPointerPosition();
    return p ?? null;
  }

  function onMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const isOnStage = e.target === e.target.getStage();

    if (!isHand) {
      // herramientas de dibujo: iniciar draft y salir
      if (draw.onMouseDown(e)) return;
      if (activeTool === 'select') {
        if (isOnStage) {
          // drag marquee on empty area
          const p = stagePosPx(e);
          if (p) {
            const m = { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
            setMarquee(m);
            marqueeRef.current = m;
          }
          clearSelection();
        }
      }
      return;
    }

    panningRef.current = true;
    panStart.current = {
      x: e.evt.clientX,
      y: e.evt.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }
  function onMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (panningRef.current) {
      setOffset({
        x: panStart.current.ox + (e.evt.clientX - panStart.current.x),
        y: panStart.current.oy + (e.evt.clientY - panStart.current.y),
      });
      return;
    }
    if (marqueeRef.current) {
      const p = stagePosPx(e);
      if (p) {
        const m = { ...marqueeRef.current, x2: p.x, y2: p.y };
        setMarquee(m);
        marqueeRef.current = m;
      }
      return;
    }
    // si estamos dibujando, actualizar draft
    draw.onMouseMove(e);
    const stage = stageRef.current;
    if (!stage) return;
    const p = stage.getPointerPosition();
    if (!p) return;
    setCursor(pxToMm(p.x - offset.x, zoom), pxToMm(p.y - offset.y, zoom));
  }
  function onMouseUp() {
    panningRef.current = false;
    if (marqueeRef.current) {
      const m = marqueeRef.current;
      const rx1 = Math.min(m.x1, m.x2);
      const ry1 = Math.min(m.y1, m.y2);
      const rx2 = Math.max(m.x1, m.x2);
      const ry2 = Math.max(m.y1, m.y2);
      if (rx2 - rx1 > 4 && ry2 - ry1 > 4 && page) {
        const s = MM_TO_PX * zoom;
        const hits = page.elements.filter((el) => {
          const ex1 = el.x * s + offset.x;
          const ey1 = el.y * s + offset.y;
          const ex2 = ex1 + ('width' in el ? (el as { width: number }).width * s : 0);
          const ey2 = ey1 + ('height' in el ? (el as { height: number }).height * s : 0);
          return ex1 < rx2 && ex2 > rx1 && ey1 < ry2 && ey2 > ry1;
        });
        if (hits.length > 0) useSelectionStore.getState().select(hits.map((e) => e.id));
      }
      setMarquee(null);
      marqueeRef.current = null;
      return;
    }
    draw.onMouseUp();
  }

  const cursor = isHand
    ? panningRef.current
      ? 'grabbing'
      : 'grab'
    : activeTool === 'select'
      ? 'default'
      : 'crosshair';

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative overflow-hidden"
      style={{ background: 'var(--canvas)', cursor }}
    >
      {editingEl && (
        <TextEditorOverlay
          el={editingEl}
          zoom={zoom}
          offsetX={offset.x}
          offsetY={offset.y}
          onCommit={(text) => {
            updateElement(editingEl.id, { text });
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <Layer>
          {page && <Sheet page={page} zoom={zoom} offsetX={offset.x} offsetY={offset.y} />}
          {page && (
            <ElementsLayer
              page={page}
              zoom={zoom}
              offsetX={offset.x}
              offsetY={offset.y}
            />
          )}
          {draw.draft && (
            <DraftOverlay
              draft={draw.draft}
              zoom={zoom}
              offsetX={offset.x}
              offsetY={offset.y}
            />
          )}
          <SelectionTransformer stageRef={stageRef} />
          {marquee && (
            <Rect
              x={Math.min(marquee.x1, marquee.x2)}
              y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)}
              height={Math.abs(marquee.y2 - marquee.y1)}
              fill="rgba(100,149,237,0.15)"
              stroke="#6495ed"
              strokeWidth={1}
              dash={[4, 3]}
              listening={false}
            />
          )}
        </Layer>

        <Layer listening={false}>
          <Rulers
            viewportWidth={size.w}
            viewportHeight={size.h}
            originX={offset.x}
            originY={offset.y}
            pxPerMm={zoom * MM_TO_PX}
          />
        </Layer>
      </Stage>
    </div>
  );
}
