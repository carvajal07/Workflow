import { useEffect } from 'react';
import AppShell from './layout/AppShell';
import { useUIStore } from '@/store/uiStore';

export default function App() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }, [theme]);

  return <AppShell />;
}
