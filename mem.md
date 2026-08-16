# Memória operacional — Geradores HUL

## Decisões permanentes

- Desenvolvimento e execução local via Docker Compose.
- Sem Supabase e sem dependência de VM/provedor durante o desenvolvimento.
- Backend próprio com Fastify, PostgreSQL, autenticação por sessão e armazenamento local compatível com S3.
- Frontend Next.js + TypeScript.
- Segredos, chaves e arquivos `.env` ficam somente em `C:\Users\0602382\.config\geradores-hul\`, nunca no Git.
- Toda fase deve terminar com testes de saída registrados antes de ser considerada concluída.
- Não usar dados falsos como se fossem dados reais.
- `main` fica para versões estáveis; `dev` é a branch de integração.
- Templates de issues ficam versionados em `.github/ISSUE_TEMPLATE/`; não criar issues automaticamente.

## Fases

### Fase 01 — Fundação Docker e scaffold

Status: concluída.

- Compose local com web, API, PostgreSQL e storage.
- Scaffold Next.js e Fastify.
- `.env.example`, README e estrutura inicial.

Testes de saída: `docker compose config`, build/up dos serviços, painel `200`, API `/health` `200`, MinIO health `200`, PostgreSQL aceitando conexões e resolução interna entre containers.

### Fase 02 — Autenticação e perfis

Status: concluída.

- Usuário, perfil, sessão e auditoria inicial no PostgreSQL.
- Login, logout, sessão atual, cadastro técnico e bootstrap de administrador.
- Sessão em cookie HttpOnly com token armazenado apenas por hash.

Testes de saída: build/typecheck da API, migration idempotente, cadastro/login/me/logout com invalidação de sessão, retorno `401` após logout e login de administrador promovido.

### Fase 03 — Integração da autenticação no painel web

Status: concluída.

- Tela `/login` integrada à API.
- Painel protegido por sessão; usuário não autenticado é enviado para `/login`.
- Exibição do usuário/perfil e logout.
- Cliente HTTP do frontend configurado para cookies de sessão.

Testes de saída: `docker compose build web`, `npm run build` dentro do container, rota `/login` `200`, rota `/` `200` e API `/health` `200`.

### Fase 04 — Modelo de negócio e CRUD de geradores

Status: próxima.

- Definir e implementar tabelas de geradores, localizações e dados do tanque.
- Criar endpoints protegidos por perfil.
- Criar tela de listagem, cadastro, edição e consulta.
- Registrar alterações relevantes para auditoria.

## Rotina de execução

```powershell
docker compose up -d --build
docker compose ps
Invoke-WebRequest http://localhost:3001/login
Invoke-WebRequest http://localhost:4000/health
```

## Estrutura de referência

```text
apps/web       Next.js
apps/api       Fastify + PostgreSQL
docker-compose.yml
.github/ISSUE_TEMPLATE/
mem.md
prd.md
```
