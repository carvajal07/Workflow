import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import type Konva from 'konva';
import Sheet from './Sheet';
import Rulers, { RULER_SIZE_PX } from './Rulers';
import { useDocumentStore } from '@/store/documentStore';
import { useUIStore } from '@/store/uiStore';
import { useToolStore } from '@/store/toolStore';
import { MM_TO_PX, pxToMm } from '@/utils/units';

/**
 * Canvas principal con Konva.
 *
 * Responsabilidades:
 *  - Dibuja la hoja (Sheet) centrada por defecto con un offset panable.
 *  - Dibuja reglas H/V en mm.
 *  - Convierte y emite las coordenadas del cursor a uiStore (en mm, relativo al origen de la hoja).
 *  - Maneja zoom con Ctrl/Cmd + rueda (centrado en el pointer, 0.1 a 5x).
 *  - Maneja pan con Espacio + drag o con la herramienta 'hand'.
 *  - Atajos: 0 = fit, 1 = 100 %.
 */
export default function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);
  const setCursor = useUIStore((s) => s.setCursor);
  const activeTool = useToolStore((s) => s.active);

  const pages = useDocumentStore((s) => s.doc.pages);
  const currentPageId = useDocumentStore((s) => s.currentPageId);
  const page = pages.find((p) => p.id === currentPageId) ?? pages[0];

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  const panningRef = useRef(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // --- medir contenedor ---
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

  // --- centrar la hoja al montar o cambiar de página / zoom inicial ---
  useEffect(() => {
    if (!page) return;
    const sheetW = page.size.width * MM_TO_PX * zoom;
    const sheetH = page.size.height * MM_TO_PX * zoom;
    const cx = RULER_SIZE_PX + Math.max(0, (size.w - RULER_SIZE_PX - sheetW) / 2);
    const cy = RULER_SIZE_PX + Math.max(0, (size.h - RULER_SIZE_PX - sheetH) / 2);
    setOffset({ x: cx, y: cy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id, size.w, size.h]);

  // --- atajos de teclado: espacio (pan), 0 (fit), 1 (100 %) ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // no interferir con inputs
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSpaceDown(true);
      } else if (e.key === '0') {
        fitToViewport();
      } else if (e.key === '1') {
        setZoom(1);
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
  }, [setZoom]);

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

  // --- zoom con rueda (Ctrl/Cmd) centrado en pointer ---
  function onWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    const native = e.evt;
    if (!(native.ctrlKey || native.metaKey)) {
      // pan con rueda (scroll normal)
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
    // mantener el punto bajo el cursor
    const mx = (pointer.x - offset.x) / zoom;
    const my = (pointer.y - offset.y) / zoom;
    const nx = pointer.x - mx * nextZoom;
    const ny = pointer.y - my * nextZoom;
    setZoom(nextZoom);
    setOffset({ x: nx, y: ny });
  }

  // --- pan: espacio + drag ó herramienta 'hand' ---
  const isHand = activeTool === 'hand' || spaceDown;

  function onMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isHand) return;
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
    // actualizar coords del cursor en mm
    const stage = stageRef.current;
    if (!stage) return;
    const p = stage.getPointerPosition();
    if (!p) return;
    const mmX = pxToMm(p.x - offset.x, zoom);
    const mmY = pxToMm(p.y - offset.y, zoom);
    setCursor(mmX, mmY);
  }
  function onMouseUp() {
    panningRef.current = false;
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
        {/* Hoja + elementos (futuros) */}
        <Layer>
          {page && <Sheet page={page} zoom={zoom} offsetX={offset.x} offsetY={offset.y} />}
        </Layer>

        {/* Reglas (capa fija encima) */}
        <Layer listening={false}>
          <Rulers
            viewportWidth={size.w}
            viewportHeight={size.h}
            originX={offset.x}
            originY={offset.y}
            zoom={zoom * MM_TO_PX}
          />
        </Layer>
      </Stage>
    </div>
  );
}
