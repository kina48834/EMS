import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (!navigationRef.isReady()) return;
  if (params) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigationRef as any).navigate(name, params);
  } else {
    navigationRef.navigate(name as never);
  }
}

export function navigateToEdit(incidentId: string) {
  navigate('Edit', { incidentId });
}

export function navigateToDetail(incidentId: string) {
  navigate('Detail', { incidentId });
}

export function getActiveRouteName(): string {
  if (!navigationRef.isReady()) return '';
  const state = navigationRef.getRootState();
  if (!state) return '';
  let current: typeof state = state;
  while (current.routes[current.index]?.state) {
    const nested = current.routes[current.index].state;
    if (!nested || !('index' in nested)) break;
    current = nested as typeof state;
  }
  return current.routes[current.index]?.name ?? '';
}
