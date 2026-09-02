-- ===========================================================================
-- CERCA · 001 · Entregas
-- ---------------------------------------------------------------------------
-- Pega esto entero en Supabase → SQL Editor → Run.
--
-- Si ya corriste una version anterior de este archivo, borra antes la tabla
-- descomentando la linea siguiente. Todavia no hay nada publicado que perder.
--
--   drop table if exists public.cerca_entregas cascade;
--
-- ---------------------------------------------------------------------------
-- LA PREGUNTA QUE ESTE ARCHIVO CONTESTA
--
-- "Que impide, tecnicamente, que alguien edite una entrega ya publicada?"
--
-- Row Level Security NO lo impide. RLS detiene a internet; no detiene al
-- dueno. El Table Editor del panel de Supabase trabaja como `service_role`,
-- y ese rol se salta RLS por diseno. Con solo RLS, la respuesta honesta era
-- "nadie lo va a hacer", que no sirve.
--
-- Lo que si lo impide, y en este orden:
--
--   1. NO HAY NADA QUE ACTUALIZAR. Cual entrega esta vigente ya no se guarda
--      en una columna: se deduce de cual es la ultima. Asi publicar de nuevo
--      es solo insertar, y ninguna operacion normal necesita tocar una fila
--      existente.
--
--   2. UN DISPARADOR QUE LO PROHIBE. Un trigger BEFORE UPDATE OR DELETE que
--      lanza un error. Los triggers se ejecutan para TODOS los roles,
--      `service_role` incluido: no hay forma de editar una entrega desde la
--      API ni desde el panel. El boton Guardar del Table Editor falla.
--
--   3. UN TESTIGO INDEPENDIENTE. Cada ejecucion que registra un alumno lleva
--      la huella de la sesion que tuvo delante, y esas filas las escribe su
--      telefono, no nosotros. Para falsificar una entrega sin dejar rastro
--      habria que editar la entrega, su huella, y ademas todas las filas de
--      ejecucion que la referencian.
--
-- EL TECHO, DICHO DE FRENTE: quien es dueno de la base puede, con suficiente
-- intencion, quitar el trigger (ALTER TABLE ... DISABLE TRIGGER). Eso ya no
-- es un descuido: es un acto deliberado que hay que ir a hacer a proposito.
-- Volverlo imposible de verdad exige poner el testigo fuera de la base, que
-- es justo la garantia de Git que cambiamos por poder publicar desde el iPad.
-- El punto 3 recupera buena parte de eso sin volver al commit.
-- ===========================================================================


-- --- 1. La clave interna ---------------------------------------------------
-- CAMBIA EL VALOR de abajo antes de correr esto. Que sea LARGA y al azar, no
-- una palabra: la pantalla de publicar vive en internet y lo unico que la
-- protege de verdad es esta clave, comprobada aqui dentro.

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
  seq          bigint generated always as identity primary key,
  token        text        not null unique,
  alumno_slug  text        not null,
  plan         text,
  sesion       jsonb       not null,
  hash         text        not null,
  nota         text,
  publicado_en timestamptz not null default now()
);

-- No hay columna `vigente`. La entrega vigente de un alumno y un plan es la
-- de mayor `seq`, y `seq` no lo elige nadie: lo asigna la base y siempre
-- sube. Quitar esa columna es lo que deja la tabla sin nada que actualizar.

create index if not exists cerca_entregas_vigencia
  on public.cerca_entregas (alumno_slug, plan, seq desc);

alter table public.cerca_entregas enable row level security;
-- Sin politicas: nadie lee ni escribe esta tabla directamente. Todo pasa por
-- las funciones. Si hubiera lectura para anon, cualquiera con la clave
-- publica podria pedir la lista completa de entregas.

revoke insert, update, delete on public.cerca_entregas from anon, authenticated;


-- --- 3. Una entrega publicada no se modifica ni se borra --------------------
-- Esto es el punto 2 de la cabecera. Se aplica a todos los roles.

create or replace function public.cerca_entregas_inmutable()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'Una entrega publicada no se modifica ni se borra (intento de % sobre el token %). Publica una entrega nueva: la anterior queda como historia, y lo que el alumno ya entreno apunta a ella.',
    tg_op, coalesce(old.token, '?');
end;
$$;

drop trigger if exists cerca_entregas_solo_insercion on public.cerca_entregas;
create trigger cerca_entregas_solo_insercion
  before update or delete on public.cerca_entregas
  for each row execute function public.cerca_entregas_inmutable();


-- --- 4. Leer una entrega, solo con su token --------------------------------
create or replace function public.cerca_entrega(p_token text)
returns table (sesion jsonb, hash text)
language sql
security definer
set search_path = public
as $$
  select e.sesion, e.hash
    from public.cerca_entregas e
   where e.token = p_token
     and e.seq = (
       select max(x.seq)
         from public.cerca_entregas x
        where x.alumno_slug = e.alumno_slug
          and x.plan is not distinct from e.plan
     );
$$;

revoke all on function public.cerca_entrega(text) from public;
grant execute on function public.cerca_entrega(text) to anon, authenticated;


-- --- 5. Publicar -----------------------------------------------------------
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

  -- Una clave corta no es una clave. Mejor que no funcione a que parezca que
  -- protege algo.
  if v_clave is null or v_clave = 'CAMBIA-ESTA-CLAVE' or length(v_clave) < 20 then
    raise exception 'La clave de publicacion no esta configurada, o es demasiado corta. Debe tener al menos 20 caracteres.';
  end if;
  if p_clave is distinct from v_clave then
    raise exception 'clave incorrecta';
  end if;

  -- Publicar es SOLO insertar. La entrega anterior no se toca: queda como
  -- historia y deja de ser la vigente porque esta trae un `seq` mayor.
  insert into public.cerca_entregas (token, alumno_slug, plan, sesion, hash, nota)
  values (p_token, p_alumno, p_plan, p_sesion, p_hash, p_nota);

  return p_token;
end;
$$;

revoke all on function public.cerca_publicar(text,text,text,text,jsonb,text,text) from public;
grant execute on function public.cerca_publicar(text,text,text,text,jsonb,text,text) to anon, authenticated;


-- --- 6. Ver lo publicado, para duplicar la semana pasada -------------------
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
  if v_clave is null or v_clave = 'CAMBIA-ESTA-CLAVE' or length(v_clave) < 20 then
    raise exception 'La clave de publicacion no esta configurada, o es demasiado corta. Debe tener al menos 20 caracteres.';
  end if;
  if p_clave is distinct from v_clave then
    raise exception 'clave incorrecta';
  end if;

  return query
    select e.token, e.alumno_slug, e.plan,
           e.seq = max(e.seq) over (partition by e.alumno_slug, e.plan) as vigente,
           e.publicado_en, e.nota, e.sesion
      from public.cerca_entregas e
     where p_alumno is null or e.alumno_slug = p_alumno
     order by e.seq desc
     limit 50;
end;
$$;

revoke all on function public.cerca_entregas_de(text,text) from public;
grant execute on function public.cerca_entregas_de(text,text) to anon, authenticated;
