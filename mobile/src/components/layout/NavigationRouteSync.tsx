import { useEffect } from 'react';
import { useAppLayout } from '../../context/AppLayoutContext';
import { getActiveRouteName, navigationRef } from '../../navigation/navigationRef';

/** Keeps active screen name in context for NavMenuPopup (rendered outside stack screens). */
export default function NavigationRouteSync() {
  const { setActiveScreen } = useAppLayout();

  useEffect(() => {
    const sync = () => setActiveScreen(getActiveRouteName());

    if (navigationRef.isReady()) sync();

    const unsub = navigationRef.addListener('state', sync);
    return unsub;
  }, [setActiveScreen]);

  return null;
}
