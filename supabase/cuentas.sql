-- Ejecutar en el SQL Editor del proyecto Supabase antes de habilitar Google.
-- Una fila por identidad verificada. El cliente público no puede leer ni
-- modificar partidas de otras cuentas. Los perfiles invitados siguen locales.
create table if not exists public.gya_cuentas (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  estado_juego jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  actualizado_en timestamptz not null default now()
);

alter table public.gya_cuentas enable row level security;
revoke all on public.gya_cuentas from anon;
-- Permite comprobar que la función está preparada; RLS devuelve cero filas
-- a visitantes sin sesión y jamás expone una partida.
grant select on public.gya_cuentas to anon;
grant select, insert, update on public.gya_cuentas to authenticated;

drop policy if exists "La persona lee su partida" on public.gya_cuentas;
create policy "La persona lee su partida" on public.gya_cuentas
  for select to authenticated using (usuario_id = (select auth.uid()));

drop policy if exists "La persona crea su partida" on public.gya_cuentas;
create policy "La persona crea su partida" on public.gya_cuentas
  for insert to authenticated with check (usuario_id = (select auth.uid()));

drop policy if exists "La persona actualiza su partida" on public.gya_cuentas;
create policy "La persona actualiza su partida" on public.gya_cuentas
  for update to authenticated using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- El cliente usa la revisión anterior en el UPDATE; dos dispositivos que
-- guarden a la vez no pisan silenciosamente la misma versión.
notify pgrst, 'reload schema';
