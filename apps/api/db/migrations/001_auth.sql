create extension if not exists pgcrypto;

do $$ begin
  create type perfil_usuario as enum ('administrador', 'gestor', 'tecnico');
exception when duplicate_object then null;
end $$;

create table usuario (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nome text not null,
  senha_hash text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table usuario_perfil (
  usuario_id uuid primary key references usuario(id) on delete cascade,
  perfil perfil_usuario not null default 'tecnico',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table sessao_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuario(id) on delete cascade,
  token_hash text not null unique,
  expira_em timestamptz not null,
  criado_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz not null default now()
);

create index sessao_usuario_token_hash_idx on sessao_usuario(token_hash);

create table registro_auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuario(id) on delete set null,
  entidade text not null,
  entidade_id text,
  operacao text not null,
  dados_anteriores jsonb,
  dados_novos jsonb,
  criado_em timestamptz not null default now()
);

create table if not exists schema_migration (
  nome text primary key,
  aplicado_em timestamptz not null default now()
);
