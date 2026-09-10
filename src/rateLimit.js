const STORAGE_KEY = "udaan_fetch_rate_limited_until";
const LOCKOUT_MS = 2 * 60 * 1000;

export function markRateLimited() {
  localStorage.setItem(STORAGE_KEY, String(Date.now() + LOCKOUT_MS));
}

export function getRateLimitRemainingMs() {
  const until = Number(localStorage.getItem(STORAGE_KEY) || 0);
  return Math.max(0, until - Date.now());
}

export function clearRateLimit() {
  localStorage.removeItem(STORAGE_KEY);
}
