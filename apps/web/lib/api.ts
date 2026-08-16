const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type UsuarioSessao = {
  id: string;
  email: string;
  nome: string;
  perfil: 'administrador' | 'gestor' | 'tecnico';
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'Não foi possível concluir a operação');
  return data as T;
}

export function login(email: string, senha: string) {
  return request<{ usuario: UsuarioSessao }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
}

export function getSession() {
  return request<{ usuario: UsuarioSessao }>('/auth/me');
}

export function logout() {
  return request<{ ok: true }>('/auth/logout', { method: 'POST', body: '{}' });
}
