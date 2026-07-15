export const AUTH_TOKEN_KEY = "token";
export const AUTH_CHANGED_EVENT = "community-auth-changed";
function emitAuthChanged() {
    if (typeof window === "undefined")
        return;
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
export function getAuthToken() {
    if (typeof window === "undefined")
        return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
}
export function persistAuthToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    emitAuthChanged();
}
export function clearAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    emitAuthChanged();
}
