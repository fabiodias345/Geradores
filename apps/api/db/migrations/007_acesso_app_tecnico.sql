alter table tecnico add column if not exists usuario_id uuid references usuario(id) on delete set null;
