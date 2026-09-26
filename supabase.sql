create table if not exists public.totem_status (
  id integer primary key,
  carga_aberta boolean not null default true,
  descarga_aberta boolean not null default true,
  data_referencia date not null default current_date,
  atualizado_em timestamptz not null default now(),
  atualizado_por text not null default 'PORTARIA'
);

insert into public.totem_status (id, carga_aberta, descarga_aberta)
values (1, true, true)
on conflict (id) do nothing;

alter table public.totem_status enable row level security;

-- Leitura pública somente deste status para a extensão.
create policy "public read totem status"
on public.totem_status
for select
to anon
using (id = 1);

-- Não crie policy de UPDATE para anon.
-- O painel Streamlit grava usando a SERVICE ROLE key armazenada nos Secrets.
