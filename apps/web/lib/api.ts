const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000';

export function resolverFotoUrl(valor: string | null) { return valor?.startsWith('storage://') ? apiUrl + '/storage/' + encodeURIComponent(valor.slice('storage://'.length)) : valor; }

export type UsuarioSessao = { id: string; email: string | null; login: string | null; nome: string; perfil: 'administrador' | 'gestor' | 'tecnico' };
export type DadosTecnicos = Record<string, string>;
export type Tecnico = { id: string; nome: string; documento: string | null; telefone_whatsapp: string | null; email: string | null; especialidade: string | null; acesso_app: boolean; perfil: 'tecnico' | 'tecnico_pro'; ativo: boolean };
export type TecnicoInput = Omit<Tecnico, 'id' | 'ativo'> & { senha?: string };
export type Administrador = { id: string; nome: string; email: string; ativo: boolean; criado_em: string };
export type AdministradorInput = { nome: string; email: string; senha?: string };
export type Servico = { id: string; gerador_id: string; tecnico_id: string | null; tipo: 'corretiva' | 'preventiva'; titulo: string; data_os: string; descricao: string | null; observacoes: string | null; gerador_nome?: string; tecnico_nome?: string | null };
export type ServicoInput = Omit<Servico, 'id' | 'gerador_nome' | 'tecnico_nome'>;
export type Gerador = { id: string; identificacao: string; localizacao: string; predio: string; modelo: string; potencia_kva: number; numero_serie: string | null; tanque_capacidade_litros: number | null; foto_url: string | null; dados_tecnicos: DadosTecnicos; ativo: boolean };
export type GeradorInput = Omit<Gerador, 'id' | 'ativo'>;
export type Empresa = { id: string; nome: string; cnpj: string; telefone: string | null; email: string | null; endereco: string | null; cidade: string | null; contato: string | null; ativo: boolean };
export type EmpresaInput = Omit<Empresa, 'id' | 'ativo'>;
export type Planejamento = { id: string; gerador_id: string; gerador_nome?: string; empresa_id: string | null; empresa_nome: string; empresa_email: string; mes_execucao: number; dia_execucao: number; troca_oleo_filtros: boolean; periodicidade_bateria_anos: number; ultima_bateria: string | null; proxima_data: string };
export type PlanejamentoInput = Omit<Planejamento, 'id' | 'gerador_nome' | 'empresa_nome' | 'empresa_email'>;

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

export function listarTecnicos() { return request<{ tecnicos: Tecnico[] }>('/tecnicos'); }
export function criarTecnico(input: TecnicoInput) { return request<{ tecnico: Tecnico }>('/tecnicos', { method: 'POST', body: JSON.stringify(input) }); }
export function atualizarTecnico(id: string, input: Partial<TecnicoInput>) { return request<{ tecnico: Tecnico }>(`/tecnicos/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function desativarTecnico(id: string) { return request<{ ok: true }>(`/tecnicos/${id}`, { method: 'DELETE' }); }

export function listarAdministradores() { return request<{ administradores: Administrador[] }>('/administradores'); }
export function criarAdministrador(input: AdministradorInput) { return request<{ administrador: Administrador }>('/administradores', { method: 'POST', body: JSON.stringify(input) }); }
export function atualizarAdministrador(id: string, input: Partial<AdministradorInput>) { return request<{ administrador: Administrador }>(`/administradores/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function desativarAdministrador(id: string) { return request<{ ok: true }>(`/administradores/${id}`, { method: 'DELETE' }); }

export function listarServicos() { return request<{ servicos: Servico[] }>('/servicos'); }
export function criarServico(input: ServicoInput) { return request<{ servico: Servico }>('/servicos', { method: 'POST', body: JSON.stringify(input) }); }
export function atualizarServico(id: string, input: Partial<ServicoInput>) { return request<{ servico: Servico }>(`/servicos/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function apagarServico(id: string) { return request<{ ok: true }>(`/servicos/${id}`, { method: 'DELETE' }); }
export function listarPlanejamentos() { return request<{ planejamentos: Planejamento[] }>('/planejamento'); }
export function criarPlanejamento(input: PlanejamentoInput) { return request<{ planejamento: Planejamento }>('/planejamento', { method: 'POST', body: JSON.stringify(input) }); }
export function atualizarPlanejamento(id: string, input: Partial<PlanejamentoInput>) { return request<{ planejamento: Planejamento }>(`/planejamento/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function apagarPlanejamento(id: string) { return request<{ ok: true }>(`/planejamento/${id}`, { method: 'DELETE' }); }

export function listarEmpresas() { return request<{ empresas: Empresa[] }>('/empresas'); }
export function criarEmpresa(input: EmpresaInput) { return request<{ empresa: Empresa }>('/empresas', { method: 'POST', body: JSON.stringify(input) }); }
export function atualizarEmpresa(id: string, input: Partial<EmpresaInput>) { return request<{ empresa: Empresa }>(`/empresas/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function apagarEmpresa(id: string) { return request<{ ok: true }>(`/empresas/${id}`, { method: 'DELETE' }); }
