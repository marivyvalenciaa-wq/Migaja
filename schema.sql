-- =========================================================
-- Esquema de base de datos para La Migaja — Supabase (Postgres)
-- Pegue todo esto en Supabase → SQL Editor → Run
-- =========================================================

create extension if not exists pgcrypto; -- para hashear la contraseña del admin

create table if not exists usuarios (
  id bigserial primary key,
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('administrador','cliente')),
  nombre text not null,
  iniciales text not null,
  created_at timestamptz default now()
);

create table if not exists pedidos (
  id bigserial primary key,
  username text not null references usuarios(username),
  cliente_nombre text not null,
  producto text not null,
  cantidad integer not null,
  estado text not null default 'pendiente',
  created_at timestamptz default now()
);

create table if not exists reservas (
  id bigserial primary key,
  username text not null references usuarios(username),
  cliente_nombre text not null,
  fecha date not null,
  hora time not null,
  personas integer not null,
  estado text not null default 'pendiente',
  created_at timestamptz default now()
);

create table if not exists avisos (
  id bigserial primary key,
  texto text not null,
  created_at timestamptz default now()
);

-- Cuenta de administrador inicial (usuario: administrador / clave: admin2026)
-- Cámbiela después desde la app o con un UPDATE.
insert into usuarios (username, password_hash, role, nombre, iniciales)
values (
  'administrador',
  crypt('admin2026', gen_salt('bf')),
  'administrador',
  'Administrador/a de la casona',
  'AD'
)
on conflict (username) do nothing;

-- =========================================================
-- Seguridad (RLS): el backend usará la "service role key", que
-- se salta RLS por diseño — por eso aquí basta con activarlo y
-- no dejar ninguna política para el rol "anon" (público). Esto
-- asegura que nadie pueda leer/escribir directo desde el navegador
-- sin pasar por su servidor Node.
-- =========================================================
alter table usuarios enable row level security;
alter table pedidos  enable row level security;
alter table reservas enable row level security;
alter table avisos   enable row level security;
