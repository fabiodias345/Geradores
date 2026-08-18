import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { autenticar, criarSessao, encerrarSessao, obterUsuario } from './auth.js';
import { executarMigrations } from './db.js';
import { atualizarGerador, criarGerador, desativarGerador, listarGeradores, validarGerador, type GeradorInput } from './geradores.js';
import { atualizarTecnico, criarTecnico, desativarTecnico, listarTecnicos, validarTecnico, type TecnicoInput } from './tecnicos.js';
import { atualizarAdministrador, criarAdministrador, desativarAdministrador, listarAdministradores, validarAdministrador, type AdministradorInput } from './usuarios.js';
import { apagarServico, atualizarServico, criarServico, listarServicos, validarServico, type ServicoInput } from './servicos.js';
import { apagarPlanejamento, atualizarPlanejamento, criarPlanejamento, listarPlanejamentos, validarPlanejamento, type PlanejamentoInput } from './planejamento.js';
import { enviarLembretesPlanejamento } from './planejamento-email.js';
import { apagarEmpresa, atualizarEmpresa, criarEmpresa, listarEmpresas, validarEmpresa, type EmpresaInput } from './empresas.js';
import { chaveFoto, obterFoto } from './storage.js';

const app = Fastify({ logger: true });
await app.register(cookie);
await app.register(cors, { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001', credentials: true });

app.get('/health', async () => ({ status: 'ok', service: 'geradores-hul-api' }));


app.get('/storage/*', async (request, reply) => {
  if (!await usuarioAutenticado(request, reply)) return;
  const key = chaveFoto(`storage://${(request.params as { '*': string })['*']}`);
  if (!key || !key.startsWith('geradores/')) return reply.code(404).send({ error: 'foto não encontrada' });
  try { const foto = await obterFoto(key); return reply.type(foto.contentType).send(foto.body); } catch { return reply.code(404).send({ error: 'foto não encontrada' }); }
});
app.post('/auth/register', async (_request, reply) => reply.code(403).send({ error: 'cadastro pÃºblico desativado; usuÃ¡rio deve ser liberado pelo administrador' }));

app.post<{ Body: { identificador?: string; senha?: string } }>('/auth/login', async (request, reply) => {
  const { identificador, senha } = request.body ?? {};
  if (!identificador || !senha) return reply.code(400).send({ error: 'login ou e-mail institucional e senha sÃ£o obrigatÃ³rios' });
  try {
    const usuarioId = await autenticar(identificador, senha);
    if (!usuarioId) return reply.code(401).send({ error: 'login, e-mail ou senha invÃ¡lidos ou nÃ£o liberados' });
    await criarSessao(usuarioId, reply);
    return { usuario: await obterUsuario(request) };
  } catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'identificador invÃ¡lido' }); }
});

app.post('/auth/logout', async (request, reply) => { await encerrarSessao(request, reply); return { ok: true }; });
app.get('/auth/me', async (request, reply) => {
  const usuario = await obterUsuario(request);
  if (!usuario) return reply.code(401).send({ error: 'sessÃ£o invÃ¡lida ou expirada' });
  return { usuario };
});

async function usuarioAutenticado(request: FastifyRequest, reply: FastifyReply, perfis?: string[]) {
  const usuario = await obterUsuario(request);
  if (!usuario) { await reply.code(401).send({ error: 'sessÃ£o invÃ¡lida ou expirada' }); return null; }
  if (perfis && !perfis.includes(usuario.perfil)) { await reply.code(403).send({ error: 'perfil sem permissÃ£o para esta operaÃ§Ã£o' }); return null; }
  return usuario;
}

function idValido(id: string) { return /^[0-9a-f-]{36}$/i.test(id); }

app.get('/servicos', async (request, reply) => {
  if (!await usuarioAutenticado(request, reply, ['administrador', 'gestor'])) return;
  return { servicos: await listarServicos() };
});

app.post<{ Body: Partial<ServicoInput> }>('/servicos', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador', 'gestor']);
  if (!usuario) return;
  try { return reply.code(201).send({ servico: await criarServico(validarServico(request.body ?? {}) as ServicoInput, usuario.id) }); }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel criar a O.S.' }); }
});

app.patch<{ Params: { id: string }; Body: Partial<ServicoInput> }>('/servicos/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador', 'gestor']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de O.S. invÃ¡lido' });
  try { return { servico: await atualizarServico(request.params.id, validarServico(request.body ?? {}, true) as Partial<ServicoInput>, usuario.id) }; }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel editar a O.S.' }); }
});

app.delete<{ Params: { id: string } }>('/servicos/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador', 'gestor']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de O.S. invÃ¡lido' });
  try { await apagarServico(request.params.id, usuario.id); return { ok: true }; }
  catch (error: unknown) { return reply.code(404).send({ error: error instanceof Error ? error.message : 'O.S. nÃ£o encontrada' }); }
});
app.get('/empresas', async (request, reply) => {
  if (!await usuarioAutenticado(request, reply, ['administrador', 'gestor'])) return;
  return { empresas: await listarEmpresas() };
});
app.post<{ Body: Partial<EmpresaInput> }>('/empresas', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  try { return reply.code(201).send({ empresa: await criarEmpresa(validarEmpresa(request.body ?? {}) as EmpresaInput, usuario.id) }); }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel criar a empresa' }); }
});
app.patch<{ Params: { id: string }; Body: Partial<EmpresaInput> }>('/empresas/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de empresa invÃ¡lido' });
  try { return { empresa: await atualizarEmpresa(request.params.id, validarEmpresa(request.body ?? {}, true) as Partial<EmpresaInput>, usuario.id) }; }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel editar a empresa' }); }
});
app.delete<{ Params: { id: string } }>('/empresas/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de empresa invÃ¡lido' });
  try { await apagarEmpresa(request.params.id, usuario.id); return { ok: true }; }
  catch (error: unknown) { return reply.code(404).send({ error: error instanceof Error ? error.message : 'empresa nÃ£o encontrada' }); }
});app.get('/planejamento', async (request, reply) => {
  if (!await usuarioAutenticado(request, reply, ['administrador', 'gestor'])) return;
  return { planejamentos: await listarPlanejamentos() };
});
app.post<{ Body: Partial<PlanejamentoInput> }>('/planejamento', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador', 'gestor']);
  if (!usuario) return;
  try { return reply.code(201).send({ planejamento: await criarPlanejamento(validarPlanejamento(request.body ?? {}) as PlanejamentoInput, usuario.id) }); }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel criar o planejamento' }); }
});
app.patch<{ Params: { id: string }; Body: Partial<PlanejamentoInput> }>('/planejamento/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador', 'gestor']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de planejamento invÃ¡lido' });
  try { return { planejamento: await atualizarPlanejamento(request.params.id, validarPlanejamento(request.body ?? {}, true) as Partial<PlanejamentoInput>, usuario.id) }; }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel editar o planejamento' }); }
});
app.delete<{ Params: { id: string } }>('/planejamento/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador', 'gestor']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de planejamento invÃ¡lido' });
  try { await apagarPlanejamento(request.params.id, usuario.id); return { ok: true }; }
  catch (error: unknown) { return reply.code(404).send({ error: error instanceof Error ? error.message : 'planejamento nÃ£o encontrado' }); }
});
app.get('/administradores', async (request, reply) => {
  if (!await usuarioAutenticado(request, reply, ['administrador'])) return;
  return { administradores: await listarAdministradores() };
});

app.post<{ Body: Partial<AdministradorInput> }>('/administradores', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  try { return reply.code(201).send({ administrador: await criarAdministrador(validarAdministrador(request.body ?? {}) as AdministradorInput) }); }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel criar o administrador' }); }
});

app.patch<{ Params: { id: string }; Body: Partial<AdministradorInput> }>('/administradores/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de administrador invÃ¡lido' });
  try { return { administrador: await atualizarAdministrador(request.params.id, validarAdministrador(request.body ?? {}, true) as Partial<AdministradorInput>) }; }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel atualizar o administrador' }); }
});

app.delete<{ Params: { id: string } }>('/administradores/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (usuario.id === request.params.id) return reply.code(400).send({ error: 'nÃ£o Ã© possÃ­vel inativar o prÃ³prio usuÃ¡rio' });
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de administrador invÃ¡lido' });
  try { await desativarAdministrador(request.params.id); return { ok: true }; }
  catch (error: unknown) { return reply.code(404).send({ error: error instanceof Error ? error.message : 'administrador nÃ£o encontrado' }); }
});
app.get('/tecnicos', async (request, reply) => {
  if (!await usuarioAutenticado(request, reply, ['administrador', 'gestor'])) return;
  return { tecnicos: await listarTecnicos() };
});

app.post<{ Body: Partial<TecnicoInput> }>('/tecnicos', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  try { return reply.code(201).send({ tecnico: await criarTecnico(validarTecnico(request.body ?? {}) as TecnicoInput, usuario.id) }); }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel criar o tÃ©cnico' }); }
});

app.patch<{ Params: { id: string }; Body: Partial<TecnicoInput> }>('/tecnicos/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de tÃ©cnico invÃ¡lido' });
  try { return { tecnico: await atualizarTecnico(request.params.id, validarTecnico(request.body ?? {}, true) as Partial<TecnicoInput>, usuario.id) }; }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'nÃ£o foi possÃ­vel atualizar o tÃ©cnico' }); }
});

app.delete<{ Params: { id: string } }>('/tecnicos/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de tÃ©cnico invÃ¡lido' });
  try { await desativarTecnico(request.params.id, usuario.id); return { ok: true }; }
  catch (error: unknown) { return reply.code(404).send({ error: error instanceof Error ? error.message : 'tÃ©cnico nÃ£o encontrado' }); }
});
app.get('/geradores', async (request, reply) => {
  if (!await usuarioAutenticado(request, reply)) return;
  return { geradores: await listarGeradores() };
});

app.post<{ Body: Partial<GeradorInput> }>('/geradores', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador', 'gestor']);
  if (!usuario) return;
  try {
    const gerador = validarGerador(request.body ?? {}) as GeradorInput;
    return reply.code(201).send({ gerador: await criarGerador(gerador, usuario.id) });
  } catch (error: unknown) {
    if (error instanceof Error && (error.message.includes('obrigatÃ³rio') || error.message.includes('maior que'))) return reply.code(400).send({ error: error.message });
    if (error instanceof Error && error.message.includes('duplicate key')) return reply.code(409).send({ error: 'identificaÃ§Ã£o jÃ¡ cadastrada' });
    throw error;
  }
});

app.patch<{ Params: { id: string }; Body: Partial<GeradorInput> }>('/geradores/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador', 'gestor']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de gerador invÃ¡lido' });
  try {
    const gerador = validarGerador(request.body ?? {}, true) as Partial<GeradorInput>;
    return { gerador: await atualizarGerador(request.params.id, gerador, usuario.id) };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('nÃ£o encontrado')) return reply.code(404).send({ error: error.message });
    if (error instanceof Error && error.message.includes('duplicate key')) return reply.code(409).send({ error: 'identificaÃ§Ã£o jÃ¡ cadastrada' });
    if (error instanceof Error && (error.message.includes('obrigatÃ³rio') || error.message.includes('maior que'))) return reply.code(400).send({ error: error.message });
    throw error;
  }
});

app.delete<{ Params: { id: string } }>('/geradores/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de gerador invÃ¡lido' });
  try { await desativarGerador(request.params.id, usuario.id); return { ok: true }; }
  catch (error: unknown) { if (error instanceof Error && error.message.includes('nÃ£o encontrado')) return reply.code(404).send({ error: error.message }); throw error; }
});

const port = Number(process.env.PORT ?? 4000);
await executarMigrations();
await app.listen({ host: '0.0.0.0', port });
void enviarLembretesPlanejamento().catch((error) => app.log.error(error, 'falha ao enviar lembretes do planejamento'));
setInterval(() => void enviarLembretesPlanejamento().catch((error) => app.log.error(error, 'falha ao enviar lembretes do planejamento')), 24 * 60 * 60 * 1000);
