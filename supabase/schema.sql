-- AAA Fathima Furniture: catalogue database for the admin panel.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Then run seed.sql to load the current catalogue. Both files are safe to run again.
--
-- Who can do what (enforced by the database itself, not by the website):
--   everyone        reads categories and products that are switched on ("visible")
--   staff (admins)  read and change everything, and upload photos
-- A staff member is a Supabase Auth user whose email is listed in public.admins.

/* ---------- tables ---------- */

create table if not exists public.admins (
  email text primary key check (email = lower(email)),
  added_at timestamptz not null default now()
);

create table if not exists public.categories (
  id          text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),   -- used in links: #/c/wardrobe
  name        text not null check (length(trim(name)) > 0),            -- plural: "Wardrobes"
  single      text not null check (length(trim(single)) > 0),          -- one item: "Wardrobe"
  position    integer not null default 0,                               -- order of the home page tiles
  rep_product text,                                                     -- model whose picture is used for the tile
  photo_url   text,                                                     -- uploaded tile photo (used before rep_product)
  photo_path  text,                                                     -- storage path of that photo, for deleting it
  visible     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.products (
  id          text primary key check (id ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'),  -- model number: MW-203
  category_id text not null references public.categories (id) on update cascade on delete restrict,
  name        text,                     -- optional, e.g. a bedroom set's name: "Black Coral"
  series      text,                     -- optional, e.g. "Bedroom Series 1"
  quote       text,                     -- optional tagline shown on the product screen
  finish      text,                     -- colours and finish
  h numeric check (h > 0 and h < 1000), -- height, inches
  d numeric check (d > 0 and d < 1000), -- depth, inches
  w numeric check (w > 0 and w < 1000), -- width, inches
  components  jsonb not null default '[]'::jsonb,   -- pieces of a set: [{code, name, h, d, w}]
  specs       jsonb not null default '[]'::jsonb,   -- [[label, value], ...] kept in this order
  photo_url   text,                     -- large photo
  thumb_url   text,                     -- small photo for grids
  photo_path  text,                     -- storage paths, for deleting old photos
  thumb_path  text,
  art_key     text,                     -- model number of the built-in drawing in assets/js/data.js
  visible     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint components_is_array check (jsonb_typeof(components) = 'array'),
  constraint specs_is_array check (jsonb_typeof(specs) = 'array')
);

create index if not exists products_category_idx on public.products (category_id);

-- the tile model must exist; renaming it follows, deleting it clears the tile choice
do $$ begin
  alter table public.categories
    add constraint categories_rep_product_fkey foreign key (rep_product)
    references public.products (id) on update cascade on delete set null;
exception when duplicate_object then null; end $$;

/* ---------- keep updated_at current ---------- */

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

/* ---------- who is staff ---------- */

-- security definer so policies can read admins without exposing the list
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

/* ---------- row level security ---------- */

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select on public.admins to authenticated;

-- admins: a signed-in user can only see their own row (the admin page uses it to check access)
drop policy if exists "admins: read own row" on public.admins;
create policy "admins: read own row" on public.admins for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- categories
drop policy if exists "categories: public reads visible" on public.categories;
create policy "categories: public reads visible" on public.categories for select to anon, authenticated
  using (visible or public.is_admin());
drop policy if exists "categories: staff insert" on public.categories;
create policy "categories: staff insert" on public.categories for insert to authenticated
  with check (public.is_admin());
drop policy if exists "categories: staff update" on public.categories;
create policy "categories: staff update" on public.categories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "categories: staff delete" on public.categories;
create policy "categories: staff delete" on public.categories for delete to authenticated
  using (public.is_admin());

-- products: hidden products, and products in hidden categories, are only seen by staff
drop policy if exists "products: public reads visible" on public.products;
create policy "products: public reads visible" on public.products for select to anon, authenticated
  using (
    public.is_admin()
    or (visible and exists (select 1 from public.categories c where c.id = category_id and c.visible))
  );
drop policy if exists "products: staff insert" on public.products;
create policy "products: staff insert" on public.products for insert to authenticated
  with check (public.is_admin());
drop policy if exists "products: staff update" on public.products;
create policy "products: staff update" on public.products for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products: staff delete" on public.products;
create policy "products: staff delete" on public.products for delete to authenticated
  using (public.is_admin());

/* ---------- photo storage ---------- */

-- public bucket: anyone can view photos by URL; only staff can upload or delete
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos: staff upload" on storage.objects;
create policy "photos: staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_admin());
drop policy if exists "photos: staff update" on storage.objects;
create policy "photos: staff update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.is_admin());
drop policy if exists "photos: staff delete" on storage.objects;
create policy "photos: staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_admin());
-- staff need to see objects in order to delete them through the API
drop policy if exists "photos: staff list" on storage.objects;
create policy "photos: staff list" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_admin());
