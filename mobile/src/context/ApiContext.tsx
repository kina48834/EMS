import { createContext, useContext, type ReactNode } from 'react';
import type { EmsClient } from '@ems/shared';
import { ems } from '../emsClient';

const Ctx = createContext<EmsClient | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={ems}>{children}</Ctx.Provider>;
}

export function useApi(): EmsClient {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApi outside ApiProvider');
  return v;
}
