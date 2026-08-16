create table if not exists gerador (
  id uuid primary key default gen_random_uuid(),
  identificacao text not null unique,
  localizacao text not null,
  predio text not null,
  modelo text not null,
  potencia_kva numeric(10,2) not null check (potencia_kva > 0),
  numero_serie text,
  tanque_capacidade_litros numeric(10,2) check (tanque_capacidade_litros is null or tanque_capacidade_litros > 0),
  ativo boolean not null default true,
  criado_por uuid references usuario(id) on delete set null,
  atualizado_por uuid references usuario(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists gerador_ativo_idx on gerador(ativo);
create index if not exists gerador_predio_idx on gerador(predio);
