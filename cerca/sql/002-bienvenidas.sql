-- ===========================================================================
-- CERCA · 002 · Bienvenidas
-- ---------------------------------------------------------------------------
-- Pega esto entero en Supabase → SQL Editor → Run. Se puede volver a correr.
-- Necesita que 001-entregas.sql ya esté puesto: la bienvenida se publica con
-- el mismo mecanismo de entregas y el mismo token inadivinable.
--
-- ---------------------------------------------------------------------------
-- LO QUE SE GUARDA AQUÍ NO ES LO MISMO QUE LO DEMÁS
--
-- Una persona contando su historia puede incluir lesiones, operaciones o
-- dolores. Eso es información de salud, y `MATRIZ_DE_DATOS.md` la tiene
-- bloqueada hasta cerrar la revisión jurídica.
--
-- La decisión de abrir esta puerta es del entrenador, y está razonada en
-- REGISTRO_APROBADOS.md. Lo que hace esta tabla es dejarla acotada:
--
--   · se escribe, no se lee. Sin política de SELECT, nadie con la clave
--     pública puede recuperar una sola fila;
--   · cada fila declara qué versión del consentimiento aceptó la persona,
--     para que dentro de un año se sepa a qué dijo que sí;
--   · cada fila se marca como posible información de salud, para que el día
--     que exista política de retención se sepa exactamente qué borrar;
--   · cada fila declara que NO la procesó ninguna IA. Hoy es verdad, y si un
--     día deja de serlo tendrá que cambiarlo alguien a propósito.
-- ===========================================================================

create table if not exists public.cerca_bienvenidas (
  id                      bigint generated always as identity primary key,
  token                   text        not null,
  alumno_slug             text        not null,
  texto                   text,
  audio_path              text,
  audio_segundos          integer,
  consentimiento_version  text        not null,
  contiene_salud_posible  boolean     not null default true,
  procesado_por_ia        boolean     not null default false,
  client_version          text,
  source                  text,
  creado_en               timestamptz not null default now()
);

create index if not exists cerca_bienvenidas_alumno
  on public.cerca_bienvenidas (alumno_slug, creado_en desc);

alter table public.cerca_bienvenidas enable row level security;

-- Se escribe, no se lee. Es la misma forma que el feedback de las sesiones.
drop policy if exists "cerca_bienvenidas_insertar" on public.cerca_bienvenidas;
create policy "cerca_bienvenidas_insertar"
  on public.cerca_bienvenidas for insert to anon, authenticated
  with check (true);

grant insert on table public.cerca_bienvenidas to anon, authenticated;
revoke select, update, delete on table public.cerca_bienvenidas from anon, authenticated;
