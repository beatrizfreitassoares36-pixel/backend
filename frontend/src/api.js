const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique a conexão e tente novamente.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('api:unauthorized'));
    }
    throw new Error(
      body?.mensagem ||
      body?.erro?.mensagem ||
      `A API respondeu com erro HTTP ${response.status}.`
    );
  }

  return body;
}

export function getToken() {
  return sessionStorage.getItem('gestao-token');
}
