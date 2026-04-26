import { create } from 'zustand';
import { temporal } from 'zundo';
import type { DocumentModel, ElementModel, Page } from '@/types/document';
import { nextId } from '@/utils/id';

function emptyDocument(): DocumentModel {
  const now = new Date().toISOString();
  const pageId = nextId('page');
  const defaultPage: Page = {
    id: pageId,
    name: 'Página 1',
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
  return {
    id: nextId('doc'),
    name: 'Untitled',
    unit: 'mm',
    pages: [defaultPage],
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
    data: { variables: [], datasets: [] },
    dynamicComms: [],
    flows: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface DocumentState {
  doc: DocumentModel;
  currentPageId: string;
  dirty: boolean;
  lastSavedAt: string | null;

  setDoc: (d: DocumentModel) => void;
  setCurrentPage: (pageId: string) => void;
  addPage: () => void;
  removePage: (pageId: string) => void;
  updatePage: (pageId: string, patch: Partial<Page>) => void;

  addElement: (pageId: string, el: ElementModel) => void;
  updateElement: (id: string, patch: Partial<ElementModel>) => void;
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void;

  markSaved: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  temporal(
    (set) => ({
      doc: emptyDocument(),
      currentPageId: '',
      dirty: false,
      lastSavedAt: null,

      setDoc: (d) => set({ doc: d, currentPageId: d.pages[0]?.id ?? '', dirty: false }),
      setCurrentPage: (pageId) => set({ currentPageId: pageId }),

      addPage: () =>
        set((s) => {
          const id = nextId('page');
          const page: Page = {
            id,
            name: `Página ${s.doc.pages.length + 1}`,
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
          return {
            doc: { ...s.doc, pages: [...s.doc.pages, page], updatedAt: new Date().toISOString() },
            currentPageId: id,
            dirty: true,
          };
        }),

      removePage: (pageId) =>
        set((s) => {
          if (s.doc.pages.length <= 1) return s;
          const pages = s.doc.pages.filter((p) => p.id !== pageId);
          const currentPageId =
            s.currentPageId === pageId ? pages[0].id : s.currentPageId;
          return {
            doc: { ...s.doc, pages, updatedAt: new Date().toISOString() },
            currentPageId,
            dirty: true,
          };
        }),

      updatePage: (pageId, patch) =>
        set((s) => ({
          doc: {
            ...s.doc,
            pages: s.doc.pages.map((p) =>
              p.id === pageId ? { ...p, ...patch } : p,
            ),
            updatedAt: new Date().toISOString(),
          },
          dirty: true,
        })),

      addElement: (pageId, el) =>
        set((s) => ({
          doc: {
            ...s.doc,
            pages: s.doc.pages.map((p) =>
              p.id === pageId ? { ...p, elements: [...p.elements, el] } : p,
            ),
            updatedAt: new Date().toISOString(),
          },
          dirty: true,
        })),

      updateElement: (id, patch) =>
        set((s) => ({
          doc: {
            ...s.doc,
            pages: s.doc.pages.map((p) => ({
              ...p,
              elements: p.elements.map((e) =>
                e.id === id ? ({ ...e, ...patch } as ElementModel) : e,
              ),
            })),
            updatedAt: new Date().toISOString(),
          },
          dirty: true,
        })),

      removeElement: (id) =>
        set((s) => ({
          doc: {
            ...s.doc,
            pages: s.doc.pages.map((p) => ({
              ...p,
              elements: p.elements.filter((e) => e.id !== id),
            })),
            updatedAt: new Date().toISOString(),
          },
          dirty: true,
        })),

      removeElements: (ids) =>
        set((s) => {
          const drop = new Set(ids);
          return {
            doc: {
              ...s.doc,
              pages: s.doc.pages.map((p) => ({
                ...p,
                elements: p.elements.filter((e) => !drop.has(e.id)),
              })),
              updatedAt: new Date().toISOString(),
            },
            dirty: true,
          };
        }),

      markSaved: () => set({ dirty: false, lastSavedAt: new Date().toISOString() }),
    }),
    {
      limit: 100,
      // sólo guardar lo relevante para el historial
      partialize: (state) => ({ doc: state.doc, currentPageId: state.currentPageId }),
    },
  ),
);

/** Hook para acceder a las acciones de zundo. */
export const useDocumentHistory = () => useDocumentStore.temporal;

/** Inicializa currentPageId cuando la primera página existe. */
const firstPage = useDocumentStore.getState().doc.pages[0];
if (firstPage) useDocumentStore.setState({ currentPageId: firstPage.id });
