-- KinoLog schema. Run with Supabase CLI: supabase db push
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username = lower(username) and username ~ '^[a-z0-9_]{3,24}$'),
  display_name text check (display_name is null or length(display_name) <= 60),
  avatar_url text check (avatar_url is null or length(avatar_url) <= 500),
  bio text check (bio is null or length(bio) <= 500),
  is_profile_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tmdb_movie_id integer not null check (tmdb_movie_id > 0),
  status text not null default 'planned' check (status in ('planned','watching','watched')),
  rating integer check (rating is null or rating between 1 and 10),
  review text check (review is null or length(review) <= 3000),
  is_public boolean not null default true,
  watched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_movie_id)
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 80),
  description text check (description is null or length(description) <= 500),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.watchlist_movies (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  tmdb_movie_id integer not null check (tmdb_movie_id > 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (watchlist_id, tmdb_movie_id)
);

create index user_movies_user_created_idx on public.user_movies(user_id, created_at desc);
create index user_movies_movie_idx on public.user_movies(tmdb_movie_id);
create index user_movies_user_status_idx on public.user_movies(user_id, status);
create index watchlists_user_created_idx on public.watchlists(user_id, created_at desc);
create index watchlist_movies_list_position_idx on public.watchlist_movies(watchlist_id, position);
create index watchlist_movies_movie_idx on public.watchlist_movies(tmdb_movie_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger user_movies_updated_at before update on public.user_movies for each row execute function public.set_updated_at();
create trigger watchlists_updated_at before update on public.watchlists for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare candidate text;
begin
  candidate := lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  candidate := regexp_replace(candidate, '[^a-z0-9_]', '_', 'g');
  candidate := left(candidate, 24);
  if length(candidate) < 3 then candidate := 'kino_' || substr(new.id::text, 1, 8); end if;
  if exists (select 1 from public.profiles p where p.username = candidate) then
    candidate := 'u_' || substr(replace(new.id::text, '-', ''), 1, 20);
  end if;
  insert into public.profiles(id, username, display_name)
  values (new.id, candidate, left(coalesce(new.raw_user_meta_data ->> 'display_name', candidate), 60))
  ;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile_for_user();

alter table public.profiles enable row level security;
alter table public.user_movies enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_movies enable row level security;

create policy "Public profiles or own profile are readable" on public.profiles for select
  using (is_profile_public or id = (select auth.uid()));
create policy "Users create their own profile" on public.profiles for insert
  with check (id = (select auth.uid()));
create policy "Users update their own profile" on public.profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Users delete their own profile" on public.profiles for delete
  using (id = (select auth.uid()));

create policy "Owner or public movie entries are readable" on public.user_movies for select
  using (user_id = (select auth.uid()) or (is_public and exists (
    select 1 from public.profiles p where p.id = user_movies.user_id and p.is_profile_public
  )));
create policy "Users create own movie entries" on public.user_movies for insert
  with check (user_id = (select auth.uid()));
create policy "Users update own movie entries" on public.user_movies for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users delete own movie entries" on public.user_movies for delete
  using (user_id = (select auth.uid()));

create policy "Public or own watchlists are readable" on public.watchlists for select
  using (user_id = (select auth.uid()) or is_public);
create policy "Users create own watchlists" on public.watchlists for insert
  with check (user_id = (select auth.uid()));
create policy "Users update own watchlists" on public.watchlists for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users delete own watchlists" on public.watchlists for delete
  using (user_id = (select auth.uid()));

create policy "Watchlist films follow parent visibility" on public.watchlist_movies for select
  using (exists (select 1 from public.watchlists w where w.id = watchlist_movies.watchlist_id));
create policy "Owners add films to own watchlists" on public.watchlist_movies for insert
  with check (exists (select 1 from public.watchlists w where w.id = watchlist_movies.watchlist_id and w.user_id = (select auth.uid())));
create policy "Owners update films in own watchlists" on public.watchlist_movies for update
  using (exists (select 1 from public.watchlists w where w.id = watchlist_movies.watchlist_id and w.user_id = (select auth.uid())))
  with check (exists (select 1 from public.watchlists w where w.id = watchlist_movies.watchlist_id and w.user_id = (select auth.uid())));
create policy "Owners delete films from own watchlists" on public.watchlist_movies for delete
  using (exists (select 1 from public.watchlists w where w.id = watchlist_movies.watchlist_id and w.user_id = (select auth.uid())));

grant select, insert, update, delete on public.profiles, public.user_movies, public.watchlists, public.watchlist_movies to authenticated;
grant select on public.profiles, public.user_movies, public.watchlists, public.watchlist_movies to anon;
