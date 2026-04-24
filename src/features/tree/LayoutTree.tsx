import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Tree, type NodeApi, type NodeRendererProps, type TreeApi } from 'react-arborist';
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Edit3,
  FileText,
  Folder,
  Image as ImageIcon,
  Minus,
  QrCode,
  Square,
  Table2,
  Type,
  Variable,
} from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';
import { useSelectionStore } from '@/store/selectionStore';
import type { DocumentModel, ElementModel } from '@/types/document';

interface TreeNode {
  id: string;
  name: string;
  kind: 'group' | 'page' | 'element' | 'asset' | 'variable';
  elementType?: ElementModel['type'];
  elementId?: string;
  pageId?: string;
  children?: TreeNode[];
}

/**
 * LayoutTree con react-arborist. Refleja el documento real (pages,
 * elements, assets) y propaga clicks a los stores:
 *  - Click en un elemento → selecciona en el canvas (selectionStore) y
 *    cambia la página activa a la que lo contiene.
 *  - Click en una página → la vuelve la página activa.
 */
export default function LayoutTree() {
  const doc = useDocumentStore((s) => s.doc);
  const currentPageId = useDocumentStore((s) => s.currentPageId);
  const setCurrentPage = useDocumentStore((s) => s.setCurrentPage);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const setSelection = useSelectionStore((s) => s.select);

  const data = useMemo(() => buildTree(doc), [doc]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 240, h: 400 });
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, Math.floor(r.width)), h: Math.max(1, Math.floor(r.height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const treeRef = useRef<TreeApi<TreeNode> | null>(null);
  // Sync canvas → tree: cuando cambia la selección de elementos en el lienzo,
  // enfocar el primero en el árbol para que quede resaltado. Sólo llamamos a
  // tree.select si el árbol aún no lo tiene enfocado (evita loop con onSelect).
  useEffect(() => {
    const first = selectedIds[0];
    const tree = treeRef.current;
    if (!tree || !first) return;
    const nodeId = `el:${first}`;
    if (tree.focusedNode?.id === nodeId) return;
    tree.select(nodeId);
  }, [selectedIds]);

  function onSelect(nodes: NodeApi<TreeNode>[]) {
    const elementIds = nodes
      .filter((n) => n.data.kind === 'element' && n.data.elementId)
      .map((n) => n.data.elementId!);
    if (elementIds.length > 0) {
      // evitar loop: si ya coincide con la selección actual, no re-emitir
      const current = useSelectionStore.getState().selectedIds;
      if (!arraysEqual(elementIds, current)) setSelection(elementIds);
      const first = elementIds[0];
      const containing = doc.pages.find((p) => p.elements.some((e) => e.id === first));
      if (containing && containing.id !== currentPageId) setCurrentPage(containing.id);
      return;
    }
    const pageNode = nodes.find((n) => n.data.kind === 'page' && n.data.pageId);
    if (pageNode?.data.pageId) {
      setCurrentPage(pageNode.data.pageId);
      const current = useSelectionStore.getState().selectedIds;
      if (current.length > 0) setSelection([]);
    }
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      <Tree<TreeNode>
        ref={treeRef}
        data={data}
        width={size.w}
        height={size.h}
        rowHeight={22}
        indent={14}
        openByDefault={false}
        disableDrag
        disableDrop
        onSelect={onSelect}
      >
        {Node}
      </Tree>
    </div>
  );
}

function Node({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
  const d = node.data;
  const hasChildren = (d.children?.length ?? 0) > 0;
  const Icon = iconFor(d);
  return (
    <div
      ref={dragHandle}
      style={style}
      className="flex items-center h-[22px] text-11 select-none cursor-default hover:bg-bg-3"
      onClick={() => {
        if (hasChildren) node.toggle();
      }}
    >
      <button
        type="button"
        aria-label={node.isOpen ? 'Colapsar' : 'Expandir'}
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) node.toggle();
        }}
        className="w-4 h-full flex items-center justify-center text-muted"
      >
        {hasChildren ? (
          node.isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />
        ) : null}
      </button>
      <span className="w-4 flex items-center justify-center text-muted">
        <Icon size={12} />
      </span>
      <span
        className="flex-1 truncate px-1"
        style={node.isSelected ? { color: 'var(--accent)' } : { color: 'var(--ink)' }}
      >
        {d.name}
      </span>
      {hasChildren && (
        <span className="font-mono text-[10px] text-muted px-2">{d.children!.length}</span>
      )}
    </div>
  );
}

function iconFor(n: TreeNode) {
  if (n.kind === 'element' && n.elementType) {
    switch (n.elementType) {
      case 'text':
        return Type;
      case 'rect':
        return Square;
      case 'circle':
        return Circle;
      case 'line':
        return Minus;
      case 'pen':
        return Edit3;
      case 'image':
        return ImageIcon;
      case 'table':
        return Table2;
      case 'qr':
        return QrCode;
      case 'dataField':
        return Variable;
    }
  }
  if (n.kind === 'page') return FileText;
  if (n.kind === 'variable') return Variable;
  return Folder;
}

function buildTree(doc: DocumentModel): TreeNode[] {
  const a = doc.assets;
  const elementNode = (e: ElementModel): TreeNode => ({
    id: `el:${e.id}`,
    name: e.name ?? e.type,
    kind: 'element',
    elementType: e.type,
    elementId: e.id,
  });
  const group = (id: string, name: string, children: TreeNode[]): TreeNode => ({
    id,
    name,
    kind: 'group',
    children,
  });
  const assetNodes = (
    prefix: string,
    items: { id: string; name: string }[],
  ): TreeNode[] =>
    items.map((i) => ({ id: `${prefix}:${i.id}`, name: i.name, kind: 'asset' }));

  return [
    group('g:data', 'Data', [
      ...doc.data.variables.map(
        (v): TreeNode => ({ id: `var:${v.id}`, name: v.name, kind: 'variable' }),
      ),
      ...doc.data.datasets.map(
        (d): TreeNode => ({ id: `ds:${d.id}`, name: d.name, kind: 'variable' }),
      ),
    ]),
    group(
      'g:pages',
      'Pages',
      doc.pages.map(
        (p): TreeNode => ({
          id: `page:${p.id}`,
          name: p.name,
          kind: 'page',
          pageId: p.id,
          children: p.elements.map(elementNode),
        }),
      ),
    ),
    group('g:elements', 'Elements', doc.pages.flatMap((p) => p.elements.map(elementNode))),
    group('g:flows', 'Flows', assetNodes('flow', doc.flows)),
    group('g:paraStyles', 'ParagraphStyles', assetNodes('ps', a.paragraphStyles)),
    group('g:textStyles', 'TextStyles', assetNodes('ts', a.textStyles)),
    group('g:fonts', 'Fonts', assetNodes('font', a.fonts)),
    group('g:borderStyles', 'BorderStyles', assetNodes('bs', a.borderStyles)),
    group('g:lineStyles', 'LineStyles', assetNodes('ls', a.lineStyles)),
    group('g:fillStyles', 'FillStyles', assetNodes('fs', a.fillStyles)),
    group('g:colors', 'Colors', assetNodes('color', a.colors)),
    group('g:images', 'Images', assetNodes('img', a.images)),
    group('g:tables', 'Tables', assetNodes('tbl', a.tables)),
    group('g:rowSets', 'Rowsets', assetNodes('rs', a.rowSets)),
    group('g:cells', 'Cells', assetNodes('cell', a.cells)),
  ];
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
