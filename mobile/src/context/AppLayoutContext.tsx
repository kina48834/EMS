import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type AppLayoutContextValue = {
  sidebarOpen: boolean;
  activeScreen: string;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setActiveScreen: (name: string) => void;
};

const Ctx = createContext<AppLayoutContextValue | null>(null);

export function AppLayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('');

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const value = useMemo(
    () => ({
      sidebarOpen,
      activeScreen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      setActiveScreen,
    }),
    [sidebarOpen, activeScreen, openSidebar, closeSidebar, toggleSidebar],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppLayout(): AppLayoutContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppLayout outside AppLayoutProvider');
  return v;
}

export function useAppLayoutOptional(): AppLayoutContextValue | null {
  return useContext(Ctx);
}
