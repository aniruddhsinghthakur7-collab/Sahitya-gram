-- प्रारंभिक स्कीमा प्रस्ताव; प्रोडक्शन से पहले RLS policies की समीक्षा और परीक्षण ज़रूरी है.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'नया पाठक' check (char_length(display_name) <= 60),
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 1000),
  interface_language text not null default 'hi',
  created_at timestamptz not null default now()
);

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null,
  language_code text not null default 'hi',
  form_type text not null check (form_type in ('गद्य','पद्य','चंपू काव्य')),
  subtype text,
  categories text[] not null check (cardinality(categories) between 1 and 4),
  cover_url text,
  series_id uuid,
  part_number integer not null default 1 check (part_number > 0),
  status text not null default 'published' check (status in ('draft','published','removed')),
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table if not exists public.work_ratings (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique(work_id, user_id)
);

create table if not exists public.work_reviews (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.reading_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  last_position integer not null default 0 check (last_position >= 0),
  estimated_words_read bigint not null default 0 check (estimated_words_read >= 0),
  bookmarked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id, work_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text not null default '' check (char_length(caption) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.message_permissions (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  decision text not null check (decision in ('allowed','blocked')),
  updated_at timestamptz not null default now(),
  primary key(owner_id, sender_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

-- सुरक्षा नोट:
-- इस स्कीमा को सार्वजनिक करने से पहले सभी टेबल पर RLS सक्षम करें,
-- और अलग-अलग SELECT/INSERT/UPDATE/DELETE policies लिखकर टेस्ट करें।
-- कभी भी service_role key को browser/mobile app में न रखें।
