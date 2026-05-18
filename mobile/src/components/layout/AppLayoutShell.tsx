import type { ReactNode } from 'react';
import { AppLayoutProvider } from '../../context/AppLayoutContext';
import NavMenuPopup from './NavMenuPopup';
import NavigationRouteSync from './NavigationRouteSync';

type Props = {
  onLogout: () => void | Promise<void>;
  children: ReactNode;
};

export default function AppLayoutShell({ onLogout, children }: Props) {
  return (
    <AppLayoutProvider>
      <NavigationRouteSync />
      {children}
      <NavMenuPopup onLogout={onLogout} />
    </AppLayoutProvider>
  );
}
