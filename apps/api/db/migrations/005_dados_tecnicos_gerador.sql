alter table gerador add column if not exists dados_tecnicos jsonb not null default '{}'::jsonb;
