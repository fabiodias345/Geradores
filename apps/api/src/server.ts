import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { autenticar, criarSessao, criarUsuario, encerrarSessao, obterUsuario } from './auth.js';
import { executarMigrations } from './db.js';

const app = Fastify({ logger: true });

await app.register(cookie);
await app.register(cors, { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001', credentials: true });

app.get('/health', async () => ({ status: 'ok', service: 'geradores-hul-api' }));

app.post<{ Body: { email?: string; nome?: string; senha?: string } }>('/auth/register', async (request, reply) => {
  const { email, nome, senha } = request.body ?? {};
  if (!email || !nome || !senha || senha.length < 8) return reply.code(400).send({ error: 'email, nome e senha de 8 caracteres são obrigatórios' });
  try {
    const usuarioId = await criarUsuario(email, nome, senha);
    await criarSessao(usuarioId, reply);
    return reply.code(201).send({ usuario: { id: usuarioId, email: email.toLowerCase(), nome, perfil: 'tecnico' } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('duplicate key')) return reply.code(409).send({ error: 'email já cadastrado' });
    throw error;
  }
});

app.post<{ Body: { email?: string; senha?: string } }>('/auth/login', async (request, reply) => {
  const { email, senha } = request.body ?? {};
  if (!email || !senha) return reply.code(400).send({ error: 'email e senha são obrigatórios' });
  const usuarioId = await autenticar(email, senha);
  if (!usuarioId) return reply.code(401).send({ error: 'email ou senha inválidos' });
  await criarSessao(usuarioId, reply);
  return { usuario: await obterUsuario(request) };
});

app.post('/auth/logout', async (request, reply) => {
  await encerrarSessao(request, reply);
  return { ok: true };
});

app.get('/auth/me', async (request, reply) => {
  const usuario = await obterUsuario(request);
  if (!usuario) return reply.code(401).send({ error: 'sessão inválida ou expirada' });
  return { usuario };
});

const port = Number(process.env.PORT ?? 4000);
await executarMigrations();
await app.listen({ host: '0.0.0.0', port });
