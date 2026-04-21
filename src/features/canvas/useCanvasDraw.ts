import { useCallback, useState } from 'react';
import type Konva from 'konva';
import { useDocumentStore } from '@/store/documentStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useToolStore, type Tool } from '@/store/toolStore';
import { pxToMm } from '@/utils/units';
import { nextId } from '@/utils/id';
import type {
  CircleEl,
  ElementModel,
  LineEl,
  PenEl,
  RectEl,
} from '@/types/document';

export type DrawTool = 'rect' | 'circle' | 'line' | 'pen';

export interface Draft {
  tool: DrawTool;
  startMm: { x: number; y: number };
  currentMm: { x: number; y: number };
  /** Puntos acumulados en mm, sólo para `pen`. */
  pointsMm?: { x: number; y: number }[];
  /** Si true, rect/circle mantienen proporción 1:1 (Shift). */
  constrain: boolean;
}

export function isDrawTool(t: Tool): t is DrawTool {
  return t === 'rect' || t === 'circle' || t === 'line' || t === 'pen';
}

interface Args {
  offsetX: number;
  offsetY: number;
  zoom: number;
  pageId: string;
  /** Siguiente zIndex a asignar. */
  nextZIndex: () => number;
}

/**
 * Hook que maneja la creación de elementos con drag sobre el Stage.
 * - Devuelve handlers para conectar al Stage y el `draft` para previsualizar.
 * - Al soltar, hace `addElement` en el store y selecciona el nuevo elemento.
 */
export function useCanvasDraw({ offsetX, offsetY, zoom, pageId, nextZIndex }: Args) {
  const activeTool = useToolStore((s) => s.active);
  const setTool = useToolStore((s) => s.setActive);
  const autoReturn = useToolStore((s) => s.autoReturnToSelect);
  const addElement = useDocumentStore((s) => s.addElement);
  const select = useSelectionStore((s) => s.select);

  const [draft, setDraft] = useState<Draft | null>(null);

  const pointerMm = useCallback(
    (stage: Konva.Stage | null) => {
      if (!stage) return null;
      const p = stage.getPointerPosition();
      if (!p) return null;
      return { x: pxToMm(p.x - offsetX, zoom), y: pxToMm(p.y - offsetY, zoom) };
    },
    [offsetX, offsetY, zoom],
  );

  const onMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): boolean => {
      if (!isDrawTool(activeTool)) return false;
      // sólo iniciar dibujo si el click es en el Stage (no sobre otro elemento)
      if (e.target !== e.target.getStage()) return false;
      const m = pointerMm(e.target.getStage());
      if (!m) return false;
      setDraft({
        tool: activeTool,
        startMm: m,
        currentMm: m,
        pointsMm: activeTool === 'pen' ? [m] : undefined,
        constrain: e.evt.shiftKey,
      });
      return true;
    },
    [activeTool, pointerMm],
  );

  const onMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): boolean => {
      if (!draft) return false;
      const m = pointerMm(e.target.getStage());
      if (!m) return false;
      setDraft((d) => {
        if (!d) return d;
        const next: Draft = { ...d, currentMm: m, constrain: e.evt.shiftKey };
        if (d.tool === 'pen') {
          next.pointsMm = [...(d.pointsMm ?? []), m];
        }
        return next;
      });
      return true;
    },
    [draft, pointerMm],
  );

  const onMouseUp = useCallback((): boolean => {
    if (!draft) return false;
    const el = draftToElement(draft, nextZIndex());
    if (el) {
      addElement(pageId, el);
      select([el.id]);
      if (autoReturn) setTool('select');
    }
    setDraft(null);
    return true;
  }, [draft, pageId, nextZIndex, addElement, select, autoReturn, setTool]);

  const cancel = useCallback(() => setDraft(null), []);

  return {
    draft,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    cancel,
    isDrawing: draft !== null,
    isDrawToolActive: isDrawTool(activeTool),
  };
}

function applyConstrain(
  start: { x: number; y: number },
  current: { x: number; y: number },
): { x: number; y: number } {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const d = Math.max(Math.abs(dx), Math.abs(dy));
  return {
    x: start.x + Math.sign(dx || 1) * d,
    y: start.y + Math.sign(dy || 1) * d,
  };
}

function bboxFromTwoPoints(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

function draftToElement(d: Draft, zIndex: number): ElementModel | null {
  const baseCommon = {
    id: nextId('el'),
    rotation: 0,
    visible: true,
    locked: false,
    zIndex,
  };

  if (d.tool === 'rect' || d.tool === 'circle') {
    const end = d.constrain ? applyConstrain(d.startMm, d.currentMm) : d.currentMm;
    const { x, y, w, h } = bboxFromTwoPoints(d.startMm, end);
    if (w < 0.5 && h < 0.5) return null;
    const width = Math.max(0.5, w);
    const height = Math.max(0.5, h);
    if (d.tool === 'rect') {
      const el: RectEl = {
        ...baseCommon,
        type: 'rect',
        x,
        y,
        width,
        height,
        fill: 'transparent',
        stroke: '#111111',
        strokeWidth: 0.25,
        cornerRadius: 0,
      };
      return el;
    }
    const el: CircleEl = {
      ...baseCommon,
      type: 'circle',
      x,
      y,
      width,
      height,
      fill: 'transparent',
      stroke: '#111111',
      strokeWidth: 0.25,
    };
    return el;
  }

  if (d.tool === 'line') {
    const end = d.constrain ? applyConstrain(d.startMm, d.currentMm) : d.currentMm;
    const { x, y, w, h } = bboxFromTwoPoints(d.startMm, end);
    if (w < 0.5 && h < 0.5) return null;
    const el: LineEl = {
      ...baseCommon,
      type: 'line',
      x: 0,
      y: 0,
      width: Math.max(0.5, w),
      height: Math.max(0.5, h),
      points: [d.startMm.x, d.startMm.y, end.x, end.y],
      stroke: '#111111',
      strokeWidth: 0.25,
    };
    return el;
  }

  if (d.tool === 'pen') {
    const pts = d.pointsMm ?? [];
    if (pts.length < 2) return null;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const el: PenEl = {
      ...baseCommon,
      type: 'pen',
      x: 0,
      y: 0,
      width: Math.max(0.5, Math.max(...xs) - Math.min(...xs)),
      height: Math.max(0.5, Math.max(...ys) - Math.min(...ys)),
      points: pts.flatMap((p) => [p.x, p.y]),
      stroke: '#111111',
      strokeWidth: 0.25,
      tension: 0.5,
    };
    return el;
  }

  return null;
}
