create table if not exists empresa (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  telefone text,
  email text,
  endereco text,
  cidade text,
  contato text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table planejamento_preventivo add column if not exists empresa_id uuid references empresa(id);
create index if not exists empresa_nome_idx on empresa(nome);