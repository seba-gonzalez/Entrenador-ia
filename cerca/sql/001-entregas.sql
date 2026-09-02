-- ===========================================================================
-- CERCA · 001 · Entregas
-- ---------------------------------------------------------------------------
-- Pega esto entero en Supabase → SQL Editor → Run. Se puede volver a correr
-- las veces que haga falta: no borra nada.
--
-- Que resuelve:
--   1. Que una sesion publicada viva en algun lado y tenga un enlace estable.
--   2. Que ese enlace no se pueda adivinar NI listar. Sin el token no hay
--      forma de llegar a la sesion de nadie.
--   3. Que una entrega ya publicada no se edite nunca. Publicar otra vez crea
--      una entrega nueva y jubila la anterior; la anterior no se borra, porque
--      es contra ella que se registro lo que el alumno ya entreno.
--
-- Lo que NO contiene esta tabla: nada que el alumno escriba. Lo que el alumno
-- registra sigue siendo de solo escritura, en sus tablas de siempre.
-- ===========================================================================

-- --- 1. La clave interna ---------------------------------------------------
-- CAMBIA EL VALOR de abajo antes de correr esto. Es la clave con la que vas a
-- publicar. Nadie mas la tiene y no viaja en ninguna pagina publica.
--
-- Limitacion honesta: la clave se guarda tal cual. La tabla no la puede leer
-- nadie -no tiene politica de lectura- y solo la alcanza la funcion de
-- publicar. Es proporcionado al riesgo real, que es que alguien te ensucie la
-- tabla de rutinas, no que se lleve datos. El dia que quieras algo mas fuerte,
-- la casa correcta es la Edge Function `cerca-admin`, que ya existe.

create table if not exists public.cerca_config (
  clave text primary key,
  valor text not null
);
alter table public.cerca_config enable row level security;
-- Sin politicas a proposito: ni anon ni nadie la lee directamente.

insert into public.cerca_config (clave, valor)
values ('publicar', 'CAMBIA-ESTA-CLAVE')
on conflict (clave) do nothing;


-- --- 2. Las entregas -------------------------------------------------------
create table if not exists public.cerca_entregas (
  token        text primary key,
  alumno_slug  text        not null,
  plan         text,
  sesion       jsonb       not null,
  hash         text        not null,
  vigente      boolean     not null default true,
  nota         text,
  publicado_en timestamptz not null default now()
);

create index if not exists cerca_entregas_alumno
  on public.cerca_entregas (alumno_slug, vigente, publicado_en desc);

alter table public.cerca_entregas enable row level security;
-- Sin politicas a proposito. Nadie lee ni escribe esta tabla directamente:
-- todo pasa por las tres funciones de abajo. Si hubiera una politica de
-- lectura para anon, cualquiera con la clave publica podria pedir la lista
-- completa de entregas. Asi, sin token no hay nada que pedir.


-- --- 3. Leer una entrega, solo con su token --------------------------------
create or replace function public.cerca_entrega(p_token text)
returns table (sesion jsonb, hash text)
language sql
security definer
set search_path = public
as $$
  select e.sesion, e.hash
    from public.cerca_entregas e
   where e.token = p_token
     and e.vigente
   limit 1;
$$;

revoke all on function public.cerca_entrega(text) from public;
grant execute on function public.cerca_entrega(text) to anon, authenticated;


-- --- 4. Publicar -----------------------------------------------------------
create or replace function public.cerca_publicar(
  p_clave  text,
  p_token  text,
  p_alumno text,
  p_plan   text,
  p_sesion jsonb,
  p_hash   text,
  p_nota   text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clave text;
begin
  select valor into v_clave from public.cerca_config where clave = 'publicar';
  if v_clave is null or v_clave = 'CAMBIA-ESTA-CLAVE' or p_clave is distinct from v_clave then
    raise exception 'clave incorrecta';
  end if;

  -- La entrega anterior de este alumno y este plan se jubila. No se borra:
  -- lo que el alumno ya entreno apunta a ella por su hash, y ese blanco no
  -- se puede mover despues.
  update public.cerca_entregas
     set vigente = false
   where alumno_slug = p_alumno
     and plan is not distinct from p_plan
     and vigente;

  insert into public.cerca_entregas (token, alumno_slug, plan, sesion, hash, nota)
  values (p_token, p_alumno, p_plan, p_sesion, p_hash, p_nota);

  return p_token;
end;
$$;

revoke all on function public.cerca_publicar(text,text,text,text,jsonb,text,text) from public;
grant execute on function public.cerca_publicar(text,text,text,text,jsonb,text,text) to anon, authenticated;


-- --- 5. Ver lo publicado, para duplicar la semana pasada -------------------
create or replace function public.cerca_entregas_de(
  p_clave  text,
  p_alumno text default null
) returns table (
  token text, alumno_slug text, plan text, vigente boolean,
  publicado_en timestamptz, nota text, sesion jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clave text;
begin
  select valor into v_clave from public.cerca_config where clave = 'publicar';
  if v_clave is null or v_clave = 'CAMBIA-ESTA-CLAVE' or p_clave is distinct from v_clave then
    raise exception 'clave incorrecta';
  end if;

  return query
    select e.token, e.alumno_slug, e.plan, e.vigente, e.publicado_en, e.nota, e.sesion
      from public.cerca_entregas e
     where p_alumno is null or e.alumno_slug = p_alumno
     order by e.publicado_en desc
     limit 50;
end;
$$;

revoke all on function public.cerca_entregas_de(text,text) from public;
grant execute on function public.cerca_entregas_de(text,text) to anon, authenticated;
