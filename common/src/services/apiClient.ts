/**
 * Common API client utilities shared across projects.
 *
 * NOTE: Previously the error message referenced the raw server URL, which
 * is not a user-facing page. This helper centralizes the user-friendly
 * messaging so callers can surface actionable guidance without confusing
 * links.
 */
export function throwConnectionError(originalError?: unknown): never {
  // Log the original error for debugging purposes without exposing internal details to users.
  // eslint-disable-next-line no-console
  console.error('API connection error', originalError);

  throw new Error(
    'Cannot connect to server. Please:\n' +
      '• Check your internet connection\n' +
      '• Try again in a few moments\n' +
      '• Contact support if the problem persists'
  );
}
