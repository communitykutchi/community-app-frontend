export const AUTH_TOKEN_KEY = "token";
export const AUTH_CHANGED_EVENT = "community-auth-changed";
export const SESSION_EXPIRED_EVENT = "community-session-expired";

let isSessionExpiredTriggered = false;

function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function persistAuthToken(token: string) {
  isSessionExpiredTriggered = false;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  emitAuthChanged();
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  emitAuthChanged();
}

export function triggerSessionExpired(message?: string) {
  if (typeof window === "undefined") return;

  // Strict deduplication guard: prevent multiple triggers from concurrent 401s
  if (isSessionExpiredTriggered) return;
  isSessionExpiredTriggered = true;

  clearAuthToken();

  const finalMessage =
    message ||
    "Your account was logged in on another device. You have been logged out automatically.";

  window.dispatchEvent(
    new CustomEvent(SESSION_EXPIRED_EVENT, {
      detail: { message: finalMessage },
    })
  );
}

export function resetSessionExpiredState() {
  isSessionExpiredTriggered = false;
}
