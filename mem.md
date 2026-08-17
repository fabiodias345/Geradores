# Memória operacional — Geradores HUL

## Decisões permanentes

- Desenvolvimento e execução local via Docker Compose.
- Sem Supabase e sem dependência de VM/provedor durante o desenvolvimento.
- Backend próprio com Fastify, PostgreSQL, autenticação por sessão e storage local.
- Frontend Next.js + TypeScript.
- Segredos, chaves e `.env` ficam somente em `C:\Users\0602382\.config\geradores-hul\`.
- Toda fase termina com testes de saída registrados.
- Não usar dados falsos como dados reais.
- `main` guarda versões estáveis; `dev` será a branch de integração.
- Templates de issues ficam em `.github/ISSUE_TEMPLATE/`; não criar issues automaticamente.
- Acesso só para usuários previamente liberados pelo administrador. `@uel.br` não autoriza acesso sozinho; cadastro público está bloqueado.

## Fases

### Fase 01 — Fundação Docker e scaffold

Status: concluída.

Compose local com web, API, PostgreSQL e storage; scaffold Next.js/Fastify; `.env.example`, README e estrutura inicial.

Testes: `docker compose config`, build/up, painel `200`, API `/health` `200`, storage health `200`, PostgreSQL aceitando conexão e resolução entre containers.

### Fase 02 — Autenticação e perfis

Status: concluída.

Usuário, perfis, sessões, auditoria inicial, login/logout/me, cookie HttpOnly e bootstrap de administrador.

Testes: migrations idempotentes, login/logout/me, sessão invalidada após logout, `401` e login de administrador.

### Fase 03 — Integração da autenticação no painel web

Status: concluída.

Tela de login, proteção do painel, logout e identificação do usuário/perfil.

Testes: build Next.js, `/login` `200`, `/` `200`, API `/health` `200`.

### Fase 04 — Geradores

Status: concluída.

- Migration `003_geradores.sql` com identificação, prédio, localização, modelo, potência, série, tanque, status e responsáveis.
- CRUD protegido: leitura para usuário autenticado; criação/edição para administrador ou gestor; desativação para administrador.
- Auditoria de criação, alteração e desativação.
- Painel visual com inventário, estado vazio, formulário e edição.
- A imagem do gerador fica em `apps/web/public/gerador-hul.png`.
- Regra inviolável: nenhum arquivo de código pode passar de 350 linhas. Se uma alteração aproximar ou ultrapassar o limite, dividir antes de continuar; arquivos já existentes acima do limite ficam registrados para refatoração posterior, sem corrigir nesta fase.

Testes: TypeScript da API, build Next.js, migration e tabela, endpoint sem sessão `401`, login temporário `200`, criação `201`, listagem, edição e desativação; dados temporários removidos.

### Fase 05 — Liberação de usuários no painel

Status: próxima.

- Tela exclusiva de administrador para listar usuários pendentes.
- Criar usuário com login ou e-mail `@uel.br`.
- Liberar, bloquear, alterar perfil e registrar auditoria.

## Rotina local

```powershell
docker compose up -d --build
docker compose ps
Invoke-WebRequest http://localhost:3001/login
Invoke-WebRequest http://localhost:4000/health
```

## Estrutura

```text
apps/web       Next.js
apps/api       Fastify + PostgreSQL
apps/web/public/gerador-hul.png
docker-compose.yml
.github/ISSUE_TEMPLATE/
mem.md
prd.md
```
