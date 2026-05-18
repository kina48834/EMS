import { Alert, Platform } from 'react-native';

/** Works on iOS, Android, and Expo web (window.confirm). */
export function confirmAction(
  title: string,
  message: string,
  options?: { confirmLabel?: string; destructive?: boolean },
): Promise<boolean> {
  const confirmLabel = options?.confirmLabel ?? 'OK';
  const destructive = options?.destructive ?? false;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    }
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
