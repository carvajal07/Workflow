import { create } from 'zustand';

interface Panels {
  leftRail: boolean;
  leftPanel: boolean;
  formatToolbar: boolean;
  statusBar: boolean;
}

interface UIState {
  theme: 'dark' | 'light';
  panels: Panels;
  zoom: number;
  showGrid: boolean;
  showSnap: boolean;
  cursor: { x: number; y: number };

  setTheme: (t: 'dark' | 'light') => void;
  togglePanel: (key: keyof Panels) => void;
  setZoom: (z: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setCursor: (x: number, y: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  panels: { leftRail: true, leftPanel: true, formatToolbar: true, statusBar: true },
  zoom: 1,
  showGrid: false,
  showSnap: true,
  cursor: { x: 0, y: 0 },

  setTheme: (t) => {
    set({ theme: t });
    const root = document.documentElement;
    root.classList.toggle('dark', t === 'dark');
    root.classList.toggle('light', t === 'light');
  },
  togglePanel: (key) => set((s) => ({ panels: { ...s.panels, [key]: !s.panels[key] } })),
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(5, z)) }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ showSnap: !s.showSnap })),
  setCursor: (x, y) => set({ cursor: { x, y } }),
}));
