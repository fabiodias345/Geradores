create table if not exists tecnico (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  telefone_whatsapp text,
  email text,
  especialidade text,
  acesso_app boolean not null default false,
  perfil text not null default 'tecnico' check (perfil in ('tecnico', 'tecnico_pro')),
  ativo boolean not null default true,
  criado_por uuid references usuario(id) on delete set null,
  atualizado_por uuid references usuario(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists tecnico_ativo_idx on tecnico(ativo);
