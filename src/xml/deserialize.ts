import type {
  DocumentModel,
  ElementModel,
  ImageEl,
  LineEl,
  Page,
  QrEl,
  RectEl,
  TextEl,
  TextSpan,
} from '@/types/document';
import { metersToMm } from '@/utils/units';
import { nextId } from '@/utils/id';

/**
 * Deserializa un XML del backend (`Scheme_Simplified.xml`) a `DocumentModel`.
 *
 * Estrategia:
 * - Usa `DOMParser` del navegador (sin dependencia extra).
 * - Lee todos los nodos `<Variable>` para reconstruir doc.data.variables y el
 *   mapa ID→nombre usado al parsear referencias `<O Id="..."/>` en los flujos.
 * - Lee todos los nodos `<Page>` con `<Width>/<Height>` como páginas.
 * - Para elementos de cada página, recorre nodos de posición (`PathObject`,
 *   `FlowArea`, `ImageObject`, `Barcode`, `Table`) cuyo `ParentId` coincida
 *   con el id de la página.
 * - Convierte metros → mm.
 *
 * Notas:
 * - El mapeo inverso PathObject → rect/circle/line es heurístico (por cantidad
 *   de segmentos); si no es concluyente cae a `rect` con ese bounding box.
 * - Los FlowArea con nodos <O> en su contenido se reconstruyen como TextEl con
 *   spans que incluyen el binding correspondiente.
 */
export function deserializeFromXml(xml: string): DocumentModel {
  const parser = new DOMParser();
  const dom = parser.parseFromString(xml, 'application/xml');
  const err = dom.querySelector('parsererror');
  if (err) throw new Error(`XML inválido: ${err.textContent ?? ''}`);

  const now = new Date().toISOString();
  const layoutName = getText(dom.querySelector('WorkFlow > Layout > Name')) ?? 'Untitled';

  // Mapa varId → varName (para resolver referencias <O Id="..."/>)
  const varIdToName = parseVariables(dom);

  // Variables definidas: reconstruir doc.data.variables
  const variables = Array.from(varIdToName.entries()).map(([id, name]) => ({ id, name }));

  // páginas: buscamos <Page> que tengan <Width> (versión config, no jerarquía)
  const pageNodes = Array.from(dom.querySelectorAll('Page')).filter((p) =>
    p.querySelector(':scope > Width'),
  );

  const pages: Page[] = pageNodes.map((node, i) => {
    const id = getText(node.querySelector(':scope > Id')) ?? nextId('page');
    const widthM = parseFloat(getText(node.querySelector(':scope > Width')) ?? '0.21');
    const heightM = parseFloat(getText(node.querySelector(':scope > Height')) ?? '0.297');
    // nombre: buscarlo en el nodo jerarquía que tenga el mismo Id
    const name = findPageName(dom, id) ?? `Page ${i + 1}`;
    const elements = parseElementsForPage(dom, id, varIdToName);
    return {
      id,
      name,
      size: { width: metersToMm(widthM), height: metersToMm(heightM), unit: 'mm' },
      background: '#ffffff',
      margin: { top: 15, right: 15, bottom: 15, left: 15 },
      rotation: 0,
      visible: true,
      weight: 5,
      repeatedBy: 'Empty',
      addHeight: 5,
      elements,
    };
  });

  return {
    id: nextId('doc'),
    name: layoutName,
    unit: 'mm',
    pages: pages.length ? pages : [defaultPage()],
    assets: {
      fonts: [],
      colors: [],
      textStyles: [],
      paragraphStyles: [],
      borderStyles: [],
      lineStyles: [],
      fillStyles: [],
      images: [],
      tables: [],
      rowSets: [],
      cells: [],
    },
    data: { variables, datasets: [] },
    dynamicComms: [],
    flows: [],
    createdAt: now,
    updatedAt: now,
  };
}

function defaultPage(): Page {
  return {
    id: nextId('page'),
    name: 'Page 1',
    size: { width: 210, height: 297, unit: 'mm' },
    background: '#ffffff',
    margin: { top: 15, right: 15, bottom: 15, left: 15 },
    rotation: 0,
    visible: true,
    weight: 5,
    repeatedBy: 'Empty',
    addHeight: 5,
    elements: [],
  };
}

function getText(n: Element | null): string | null {
  return n?.textContent?.trim() ?? null;
}

function findPageName(dom: Document, id: string): string | null {
  const pages = Array.from(dom.querySelectorAll('Page'));
  for (const p of pages) {
    const pid = getText(p.querySelector(':scope > Id'));
    const name = getText(p.querySelector(':scope > Name'));
    const parent = getText(p.querySelector(':scope > ParentId'));
    if (pid === id && name && parent === 'Def.Pages') return name;
  }
  return null;
}

function readPosSize(
  node: Element,
): { x: number; y: number; width: number; height: number } | null {
  const pos = node.querySelector(':scope > Pos');
  const size = node.querySelector(':scope > Size');
  if (!pos || !size) return null;
  return {
    x: metersToMm(parseFloat(pos.getAttribute('X') ?? '0')),
    y: metersToMm(parseFloat(pos.getAttribute('Y') ?? '0')),
    width: metersToMm(parseFloat(size.getAttribute('X') ?? '0')),
    height: metersToMm(parseFloat(size.getAttribute('Y') ?? '0')),
  };
}

/** Nodos con ParentId = pageId que son elementos posicionados. */
function childrenOfPage(dom: Document, pageId: string, tag: string): Element[] {
  return Array.from(dom.querySelectorAll(tag)).filter(
    (n) => getText(n.querySelector(':scope > ParentId')) === pageId,
  );
}

/** Busca la versión "config" (sin ParentId) de un nodo por Id. */
function configById(dom: Document, tag: string, id: string): Element | null {
  const all = Array.from(dom.querySelectorAll(tag));
  return (
    all.find(
      (n) =>
        getText(n.querySelector(':scope > Id')) === id &&
        !n.querySelector(':scope > ParentId'),
    ) ?? null
  );
}

function baseProps(id: string, idx: number) {
  return {
    id,
    rotation: 0,
    visible: true,
    locked: false,
    zIndex: idx,
  };
}

/**
 * Parsea todos los nodos <Variable> del XML y devuelve un mapa varId → varName.
 * Se usa para resolver las referencias <O Id="varId"/> dentro de los flujos.
 */
function parseVariables(dom: Document): Map<string, string> {
  const map = new Map<string, string>();
  Array.from(dom.querySelectorAll('Variable')).forEach((v) => {
    const id = getText(v.querySelector(':scope > Id'));
    const name = getText(v.querySelector(':scope > Name'));
    if (id !== null && name !== null) {
      map.set(id, name);
    }
  });
  return map;
}

function parseElementsForPage(
  dom: Document,
  pageId: string,
  varIdToName: Map<string, string>,
): ElementModel[] {
  const out: ElementModel[] = [];

  // ---- PathObject → rect/circle/line ----
  childrenOfPage(dom, pageId, 'PathObject').forEach((hdr, idx) => {
    const id = getText(hdr.querySelector(':scope > Id'));
    if (!id) return;
    const name = getText(hdr.querySelector(':scope > Name')) ?? undefined;
    const cfg = configById(dom, 'PathObject', id);
    if (!cfg) return;
    const ps = readPosSize(cfg);
    if (!ps) return;
    const path = cfg.querySelector(':scope > Path');
    const beziers = path?.querySelectorAll(':scope > BezierTo').length ?? 0;
    const lines = path?.querySelectorAll(':scope > LineTo').length ?? 0;
    const moves = path?.querySelectorAll(':scope > MoveTo').length ?? 0;

    const fill = getText(cfg.querySelector(':scope > Fill')) ?? 'transparent';
    const stroke = getText(cfg.querySelector(':scope > Stroke')) ?? '#111111';
    const strokeWidth = parseFloat(getText(cfg.querySelector(':scope > StrokeWidth')) ?? '0.25');

    if (beziers >= 2) {
      out.push({
        type: 'circle',
        name,
        ...baseProps(id, idx),
        ...ps,
        fill,
        stroke,
        strokeWidth,
      });
    } else if (moves === 1 && lines === 1) {
      const mv = path!.querySelector(':scope > MoveTo')!;
      const ln = path!.querySelector(':scope > LineTo')!;
      const x1 = metersToMm(parseFloat(mv.getAttribute('X') ?? '0'));
      const y1 = metersToMm(parseFloat(mv.getAttribute('Y') ?? '0'));
      const x2 = metersToMm(parseFloat(ln.getAttribute('X') ?? '0'));
      const y2 = metersToMm(parseFloat(ln.getAttribute('Y') ?? '0'));
      const line: LineEl = {
        type: 'line',
        name,
        ...baseProps(id, idx),
        ...ps,
        points: [x1, y1, x2, y2],
        stroke,
        strokeWidth,
      };
      out.push(line);
    } else {
      const rect: RectEl = {
        type: 'rect',
        name,
        ...baseProps(id, idx),
        ...ps,
        fill,
        stroke,
        strokeWidth,
        cornerRadius: 0,
      };
      out.push(rect);
    }
  });

  // ---- FlowArea → text ----
  childrenOfPage(dom, pageId, 'FlowArea').forEach((hdr, idx) => {
    const id = getText(hdr.querySelector(':scope > Id'));
    if (!id) return;
    const name = getText(hdr.querySelector(':scope > Name')) ?? undefined;
    const cfg = configById(dom, 'FlowArea', id);
    if (!cfg) return;
    const ps = readPosSize(cfg);
    if (!ps) return;
    const flowId = getText(cfg.querySelector(':scope > FlowId'));
    const flowContent = flowId ? extractFlowContent(dom, flowId, varIdToName) : { text: '' };
    const fontFamily = getText(cfg.querySelector(':scope > FontFamily')) ?? 'Arial';
    const fontSize = parseFloat(getText(cfg.querySelector(':scope > FontSize')) ?? '10');
    const fontWeight = parseInt(getText(cfg.querySelector(':scope > FontWeight')) ?? '400', 10);
    const fontStyle = (getText(cfg.querySelector(':scope > FontStyle')) ?? 'normal') as 'normal' | 'italic';
    const color = getText(cfg.querySelector(':scope > TextColor')) ?? '#000000';
    const lineHeight = parseFloat(getText(cfg.querySelector(':scope > LineHeight')) ?? '1.2');
    const align = (getText(cfg.querySelector(':scope > Align')) ?? 'left') as TextEl['align'];
    const el: TextEl = {
      type: 'text',
      name,
      ...baseProps(id, idx),
      ...ps,
      text: flowContent.text,
      spans: flowContent.spans,
      fontFamily,
      fontSize,
      fontStyle,
      fontWeight,
      align,
      lineHeight,
      color,
    };
    out.push(el);
  });

  // ---- ImageObject ----
  childrenOfPage(dom, pageId, 'ImageObject').forEach((hdr, idx) => {
    const id = getText(hdr.querySelector(':scope > Id'));
    if (!id) return;
    const name = getText(hdr.querySelector(':scope > Name')) ?? undefined;
    const cfg = configById(dom, 'ImageObject', id);
    if (!cfg) return;
    const ps = readPosSize(cfg);
    if (!ps) return;
    const imageId = getText(cfg.querySelector(':scope > ImageId'));
    const location = imageId ? getImageLocation(dom, imageId) : '';
    const el: ImageEl = {
      type: 'image',
      name,
      ...baseProps(id, idx),
      ...ps,
      src: location ?? '',
      opacity: 1,
    };
    out.push(el);
  });

  // ---- Barcode (QR) ----
  childrenOfPage(dom, pageId, 'Barcode').forEach((hdr, idx) => {
    const id = getText(hdr.querySelector(':scope > Id'));
    if (!id) return;
    const name = getText(hdr.querySelector(':scope > Name')) ?? undefined;
    const cfg = configById(dom, 'Barcode', id);
    if (!cfg) return;
    const ps = readPosSize(cfg);
    if (!ps) return;
    const gen = cfg.querySelector(':scope > BarcodeGenerator');
    const err = (getText(gen?.querySelector(':scope > ErrorLevel') ?? null) ?? 'M') as
      | 'L'
      | 'M'
      | 'Q'
      | 'H';
    const modW = parseFloat(getText(gen?.querySelector(':scope > ModulWidth') ?? null) ?? '0.001');
    // Resolver el VariableId al nombre/binding original
    const rawVariableId = getText(cfg.querySelector(':scope > VariableId')) ?? undefined;
    const variable = rawVariableId
      ? (varIdToName.get(rawVariableId) ?? rawVariableId)
      : undefined;
    const el: QrEl = {
      type: 'qr',
      name,
      ...baseProps(id, idx),
      ...ps,
      data: '',
      variable,
      errorLevel: err,
      moduleSize: metersToMm(modW),
    };
    out.push(el);
  });

  return out;
}

/**
 * Extrae el contenido de un Flow como texto plano y, cuando hay nodos <O>,
 * reconstruye los spans con bindings resolviendo el varId mediante varIdToName.
 */
function extractFlowContent(
  dom: Document,
  flowId: string,
  varIdToName: Map<string, string>,
): { text: string; spans?: TextSpan[] } {
  const flow = Array.from(dom.querySelectorAll('Flow')).find((f) => {
    return (
      getText(f.querySelector(':scope > Id')) === flowId &&
      !f.querySelector(':scope > ParentId')
    );
  });
  if (!flow) return { text: '' };

  const fc = flow.querySelector(':scope > FlowContent');
  if (!fc) return { text: '' };

  const spans: TextSpan[] = [];
  let hasBinding = false;

  // Recorrer cada nodo <T> dentro de los <P>
  fc.querySelectorAll('P > T').forEach((t) => {
    const oNodes = Array.from(t.querySelectorAll(':scope > O'));

    if (oNodes.length > 0) {
      // Extraer texto de los nodos de texto hijos (usado como fallback en DataField)
      let fallbackText = '';
      t.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          fallbackText += child.textContent ?? '';
        }
      });
      const fallback = fallbackText.trim() || undefined;

      oNodes.forEach((oNode) => {
        const oId = oNode.getAttribute('Id');
        if (oId) {
          // Resolver el ID al nombre/binding original
          const binding = varIdToName.get(oId) ?? oId;
          spans.push({ binding, fallback });
          hasBinding = true;
        }
      });
    } else {
      const text = t.textContent?.trim() ?? '';
      if (text) spans.push({ text });
    }
  });

  const text = spans
    .map((s) => s.text ?? `{{${s.binding ?? ''}}}`)
    .join('');

  // Si no hay bindings, devolver solo el texto plano sin spans
  if (!hasBinding) return { text };
  return { text, spans };
}

function getImageLocation(dom: Document, imageId: string): string | null {
  const node = Array.from(dom.querySelectorAll('Image')).find(
    (n) =>
      getText(n.querySelector(':scope > Id')) === imageId &&
      !n.querySelector(':scope > ParentId'),
  );
  return getText(node?.querySelector(':scope > ImageLocation') ?? null);
}
