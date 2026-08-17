import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { autenticar, criarSessao, encerrarSessao, obterUsuario } from './auth.js';
import { executarMigrations } from './db.js';
import { atualizarGerador, criarGerador, desativarGerador, listarGeradores, validarGerador, type GeradorInput } from './geradores.js';
import { atualizarTecnico, criarTecnico, desativarTecnico, listarTecnicos, validarTecnico, type TecnicoInput } from './tecnicos.js';
import { atualizarAdministrador, criarAdministrador, desativarAdministrador, listarAdministradores, validarAdministrador, type AdministradorInput } from './usuarios.js';

const app = Fastify({ logger: true });
await app.register(cookie);
await app.register(cors, { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001', credentials: true });

app.get('/health', async () => ({ status: 'ok', service: 'geradores-hul-api' }));

app.post('/auth/register', async (_request, reply) => reply.code(403).send({ error: 'cadastro público desativado; usuário deve ser liberado pelo administrador' }));

app.post<{ Body: { identificador?: string; senha?: string } }>('/auth/login', async (request, reply) => {
  const { identificador, senha } = request.body ?? {};
  if (!identificador || !senha) return reply.code(400).send({ error: 'login ou e-mail institucional e senha são obrigatórios' });
  try {
    const usuarioId = await autenticar(identificador, senha);
    if (!usuarioId) return reply.code(401).send({ error: 'login, e-mail ou senha inválidos ou não liberados' });
    await criarSessao(usuarioId, reply);
    return { usuario: await obterUsuario(request) };
  } catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'identificador inválido' }); }
});

app.post('/auth/logout', async (request, reply) => { await encerrarSessao(request, reply); return { ok: true }; });
app.get('/auth/me', async (request, reply) => {
  const usuario = await obterUsuario(request);
  if (!usuario) return reply.code(401).send({ error: 'sessão inválida ou expirada' });
  return { usuario };
});

async function usuarioAutenticado(request: FastifyRequest, reply: FastifyReply, perfis?: string[]) {
  const usuario = await obterUsuario(request);
  if (!usuario) { await reply.code(401).send({ error: 'sessão inválida ou expirada' }); return null; }
  if (perfis && !perfis.includes(usuario.perfil)) { await reply.code(403).send({ error: 'perfil sem permissão para esta operação' }); return null; }
  return usuario;
}

function idValido(id: string) { return /^[0-9a-f-]{36}$/i.test(id); }

app.get('/administradores', async (request, reply) => {
  if (!await usuarioAutenticado(request, reply, ['administrador'])) return;
  return { administradores: await listarAdministradores() };
});

app.post<{ Body: Partial<AdministradorInput> }>('/administradores', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  try { return reply.code(201).send({ administrador: await criarAdministrador(validarAdministrador(request.body ?? {}) as AdministradorInput) }); }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'não foi possível criar o administrador' }); }
});

app.patch<{ Params: { id: string }; Body: Partial<AdministradorInput> }>('/administradores/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de administrador inválido' });
  try { return { administrador: await atualizarAdministrador(request.params.id, validarAdministrador(request.body ?? {}, true) as Partial<AdministradorInput>) }; }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'não foi possível atualizar o administrador' }); }
});

app.delete<{ Params: { id: string } }>('/administradores/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (usuario.id === request.params.id) return reply.code(400).send({ error: 'não é possível inativar o próprio usuário' });
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de administrador inválido' });
  try { await desativarAdministrador(request.params.id); return { ok: true }; }
  catch (error: unknown) { return reply.code(404).send({ error: error instanceof Error ? error.message : 'administrador não encontrado' }); }
});
app.get('/tecnicos', async (request, reply) => {
  if (!await usuarioAutenticado(request, reply, ['administrador'])) return;
  return { tecnicos: await listarTecnicos() };
});

app.post<{ Body: Partial<TecnicoInput> }>('/tecnicos', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  try { return reply.code(201).send({ tecnico: await criarTecnico(validarTecnico(request.body ?? {}) as TecnicoInput, usuario.id) }); }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'não foi possível criar o técnico' }); }
});

app.patch<{ Params: { id: string }; Body: Partial<TecnicoInput> }>('/tecnicos/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de técnico inválido' });
  try { return { tecnico: await atualizarTecnico(request.params.id, validarTecnico(request.body ?? {}, true) as Partial<TecnicoInput>, usuario.id) }; }
  catch (error: unknown) { return reply.code(400).send({ error: error instanceof Error ? error.message : 'não foi possível atualizar o técnico' }); }
});

app.delete<{ Params: { id: string } }>('/tecnicos/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de técnico inválido' });
  try { await desativarTecnico(request.params.id, usuario.id); return { ok: true }; }
  catch (error: unknown) { return reply.code(404).send({ error: error instanceof Error ? error.message : 'técnico não encontrado' }); }
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
    if (error instanceof Error && (error.message.includes('obrigatório') || error.message.includes('maior que'))) return reply.code(400).send({ error: error.message });
    if (error instanceof Error && error.message.includes('duplicate key')) return reply.code(409).send({ error: 'identificação já cadastrada' });
    throw error;
  }
});

app.patch<{ Params: { id: string }; Body: Partial<GeradorInput> }>('/geradores/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador', 'gestor']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de gerador inválido' });
  try {
    const gerador = validarGerador(request.body ?? {}, true) as Partial<GeradorInput>;
    return { gerador: await atualizarGerador(request.params.id, gerador, usuario.id) };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('não encontrado')) return reply.code(404).send({ error: error.message });
    if (error instanceof Error && error.message.includes('duplicate key')) return reply.code(409).send({ error: 'identificação já cadastrada' });
    if (error instanceof Error && (error.message.includes('obrigatório') || error.message.includes('maior que'))) return reply.code(400).send({ error: error.message });
    throw error;
  }
});

app.delete<{ Params: { id: string } }>('/geradores/:id', async (request, reply) => {
  const usuario = await usuarioAutenticado(request, reply, ['administrador']);
  if (!usuario) return;
  if (!idValido(request.params.id)) return reply.code(400).send({ error: 'id de gerador inválido' });
  try { await desativarGerador(request.params.id, usuario.id); return { ok: true }; }
  catch (error: unknown) { if (error instanceof Error && error.message.includes('não encontrado')) return reply.code(404).send({ error: error.message }); throw error; }
});

const port = Number(process.env.PORT ?? 4000);
await executarMigrations();
await app.listen({ host: '0.0.0.0', port });
