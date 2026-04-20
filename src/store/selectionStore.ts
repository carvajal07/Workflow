import { create } from 'zustand';

interface SelectionState {
  selectedIds: string[];
  select: (ids: string[]) => void;
  add: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  select: (ids) => set({ selectedIds: ids }),
  add: (id) => set((s) => (s.selectedIds.includes(id) ? s : { selectedIds: [...s.selectedIds, id] })),
  toggle: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  clear: () => set({ selectedIds: [] }),
  isSelected: (id) => get().selectedIds.includes(id),
}));
