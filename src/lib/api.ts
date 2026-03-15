const URLS = {
  auth: 'https://functions.poehali.dev/3a951529-f98b-426c-b9ee-c07629779a8c',
  chats: 'https://functions.poehali.dev/ae20fccd-2fc3-49da-84e2-aa2de754c497',
  servers: 'https://functions.poehali.dev/916d0543-de36-490e-bb8d-7858a584d726',
  contacts: 'https://functions.poehali.dev/4185979e-3d1d-48e2-9416-57c137a47680',
};

function getToken(): string {
  return localStorage.getItem('squad_token') || '';
}

async function req(
  base: keyof typeof URLS,
  path: string,
  method = 'GET',
  body?: object
) {
  const res = await fetch(`${URLS[base]}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': getToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const api = {
  auth: {
    register: (d: { username: string; display_name: string; email: string; password: string }) =>
      req('auth', '/register', 'POST', d),
    login: (d: { login: string; password: string }) =>
      req('auth', '/login', 'POST', d),
    logout: () => req('auth', '/logout', 'POST'),
    me: () => req('auth', '/me', 'GET'),
    setStatus: (status: string) => req('auth', '/status', 'PUT', { status }),
    updateProfile: (d: { display_name?: string; bio?: string; status_text?: string }) =>
      req('auth', '/profile', 'PUT', d),
  },
  chats: {
    list: () => req('chats', '/list', 'GET'),
    messages: (chat_id: number) => req('chats', `/messages?chat_id=${chat_id}`, 'GET'),
    send: (chat_id: number, content: string) => req('chats', '/send', 'POST', { chat_id, content }),
    create: (d: { type: string; user_id?: number; name?: string }) =>
      req('chats', '/create', 'POST', d),
  },
  contacts: {
    list: () => req('contacts', '/list', 'GET'),
    search: (q: string) => req('contacts', `/search?q=${encodeURIComponent(q)}`, 'GET'),
    add: (user_id: number) => req('contacts', '/add', 'POST', { user_id }),
  },
  servers: {
    list: () => req('servers', '/list', 'GET'),
    members: (server_id: number) => req('servers', `/members?server_id=${server_id}`, 'GET'),
    create: (d: { name: string; description?: string; color?: string }) =>
      req('servers', '/create', 'POST', d),
    join: (server_id: number) => req('servers', '/join', 'POST', { server_id }),
  },
};
