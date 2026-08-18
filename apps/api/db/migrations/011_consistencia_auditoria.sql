alter table ordem_servico add column if not exists atualizado_por uuid references usuario(id) on delete set null;
alter table empresa add column if not exists criado_por uuid references usuario(id) on delete set null;
alter table empresa add column if not exists atualizado_por uuid references usuario(id) on delete set null;
alter table planejamento_preventivo add column if not exists atualizado_por uuid references usuario(id) on delete set null;

alter table planejamento_preventivo alter column empresa_nome drop not null;
alter table planejamento_preventivo alter column empresa_email drop not null;
-- Mantidas por compatibilidade com dados antigos; novos registros usam empresa_id.
