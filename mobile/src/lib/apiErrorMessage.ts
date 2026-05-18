/** User-friendly messages for API / auth failures in the mobile app. */
export function formatApiError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes('2048 bytes') || lower.includes('securestore')) {
    return 'Could not save your session securely. Please sign in again after updating the app.';
  }
  if (lower.includes('network request failed') || lower.includes('failed to fetch') || lower.includes('network error')) {
    return 'No internet connection. Check Wi‑Fi or mobile data and try again.';
  }
  if (
    lower.includes('jwt') ||
    lower.includes('not signed in') ||
    lower.includes('unauthorized') ||
    lower.includes('session')
  ) {
    return 'Your session expired. Please sign out and sign in again.';
  }
  if (lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('42501')) {
    return 'You do not have permission for this action. Sign in with the correct account.';
  }

  return msg;
}
