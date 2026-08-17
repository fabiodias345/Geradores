create table if not exists ordem_servico (
  id uuid primary key default gen_random_uuid(),
  gerador_id uuid not null references gerador(id),
  tecnico_id uuid references tecnico(id),
  tipo text not null check (tipo in ('corretiva', 'preventiva')),
  titulo text not null,
  data_os date not null default current_date,
  data_conclusao timestamptz,
  horas_trabalhadas numeric(10,2),
  custo numeric(12,2),
  descricao text,
  observacoes text,
  ativo boolean not null default true,
  criado_por uuid references usuario(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists ordem_servico_gerador_idx on ordem_servico(gerador_id);
create index if not exists ordem_servico_tecnico_idx on ordem_servico(tecnico_id);
