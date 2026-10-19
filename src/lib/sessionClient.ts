const key = 'scp_session_token';
let token: string | null = null;

export function getSessionToken() {
  try {
    return token ?? window.sessionStorage.getItem(key);
  } catch {
    return token;
  }
}

export function setSessionToken(value: string | null) {
  token = value;
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // Embedded browsers may deny storage. The current tab still keeps its session.
  }
}

export function expireSession() {
  setSessionToken(null);
  window.dispatchEvent(new Event('scp-session-expired'));
}
