const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();
const baseUrl = configuredBaseUrl ? configuredBaseUrl.replace(/\/+$/, '') : '';

export async function apiRequest(path, options = {}) {
  let response;
  const token = sessionStorage.getItem('loja-token');
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique a URL e tente novamente.');
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === 'object'
      ? body.mensagem || body.erro?.mensagem
      : body;
    throw new Error(message || `A API respondeu com erro ${response.status}.`);
  }

  return body;
}

export function apiUrl(path) {
  return `${baseUrl}${path}`;
}
