create table if not exists planejamento_preventivo (
  id uuid primary key default gen_random_uuid(),
  gerador_id uuid not null references gerador(id),
  empresa_nome text not null,
  empresa_email text not null,
  mes_execucao integer not null check (mes_execucao between 1 and 12),
  dia_execucao integer not null default 1 check (dia_execucao between 1 and 28),
  troca_oleo_filtros boolean not null default true,
  periodicidade_bateria_anos integer not null default 2 check (periodicidade_bateria_anos between 1 and 10),
  ultima_bateria date,
  proxima_data date not null,
  lembrete_enviado_em timestamptz,
  ativo boolean not null default true,
  criado_por uuid references usuario(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists planejamento_ativo_gerador_idx on planejamento_preventivo(gerador_id) where ativo=true;
create index if not exists planejamento_proxima_data_idx on planejamento_preventivo(proxima_data) where ativo=true;
