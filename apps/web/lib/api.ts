const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type UsuarioSessao = { id: string; email: string | null; login: string | null; nome: string; perfil: 'administrador' | 'gestor' | 'tecnico' };
export type DadosTecnicos = Record<string, string>;
export type Gerador = { id: string; identificacao: string; localizacao: string; predio: string; modelo: string; potencia_kva: number; numero_serie: string | null; tanque_capacidade_litros: number | null; foto_url: string | null; dados_tecnicos: DadosTecnicos; ativo: boolean };
export type GeradorInput = Omit<Gerador, 'id' | 'ativo'>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'Não foi possível concluir a operação');
  return data as T;
}

export function login(identificador: string, senha: string) { return request<{ usuario: UsuarioSessao }>('/auth/login', { method: 'POST', body: JSON.stringify({ identificador, senha }) }); }
export function getSession() { return request<{ usuario: UsuarioSessao }>('/auth/me'); }
export function logout() { return request<{ ok: true }>('/auth/logout', { method: 'POST', body: '{}' }); }
export function listarGeradores() { return request<{ geradores: Gerador[] }>('/geradores'); }
export function criarGerador(input: GeradorInput) { return request<{ gerador: Gerador }>('/geradores', { method: 'POST', body: JSON.stringify(input) }); }
export function atualizarGerador(id: string, input: Partial<GeradorInput>) { return request<{ gerador: Gerador }>(`/geradores/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function desativarGerador(id: string) { return request<{ ok: true }>(`/geradores/${id}`, { method: 'DELETE' }); }
