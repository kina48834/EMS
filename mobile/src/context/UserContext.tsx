import { createContext, useCallback, useContext, type ReactNode } from 'react';
import type { User } from '../models';
import { ems } from '../emsClient';

type UserContextValue = {
  user: User;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<UserContextValue | null>(null);

export function UserProvider({
  user,
  setUser,
  children,
}: {
  user: User;
  setUser: (u: User) => void;
  children: ReactNode;
}) {
  const refreshUser = useCallback(async () => {
    const next = await ems.fetchCurrentUser();
    if (next) setUser(next);
  }, [setUser]);

  return <Ctx.Provider value={{ user, setUser, refreshUser }}>{children}</Ctx.Provider>;
}

export function useUser(): User {
  return useUserContext().user;
}

export function useUserContext(): UserContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUserContext outside UserProvider');
  return v;
}
