alter table usuario alter column email drop not null;
alter table usuario add column if not exists login text;

update usuario
set login = lower(split_part(email, '@', 1))
where login is null and email is not null and lower(email) not like '%@uel.br';

create unique index if not exists usuario_email_unico_idx on usuario (lower(email)) where email is not null;
create unique index if not exists usuario_login_unico_idx on usuario (lower(login)) where login is not null;

alter table usuario drop constraint if exists usuario_credencial_check;
alter table usuario add constraint usuario_credencial_check check (email is not null or login is not null);
