-- Create app_role enum for user roles
create type public.app_role as enum ('admin', 'user');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- User roles policies
create policy "Users can view all roles"
  on public.user_roles for select
  using (true);

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create events table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null check (event_type in ('running', 'hiit', 'strength', 'social')),
  event_date timestamp with time zone not null,
  event_time text not null,
  location text not null,
  instructor text,
  max_participants integer not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS on events
alter table public.events enable row level security;

-- Events policies
create policy "Anyone can view events"
  on public.events for select
  using (true);

create policy "Admins can insert events"
  on public.events for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update events"
  on public.events for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete events"
  on public.events for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Create event_registrations table
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  registered_at timestamp with time zone default now() not null,
  unique (event_id, user_id)
);

-- Enable RLS on event_registrations
alter table public.event_registrations enable row level security;

-- Event registrations policies
create policy "Anyone can view registrations"
  on public.event_registrations for select
  using (true);

create policy "Users can register for events"
  on public.event_registrations for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel their registrations"
  on public.event_registrations for delete
  using (auth.uid() = user_id);

-- Create classes table
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructor text not null,
  class_date date not null,
  class_time text not null,
  duration text not null,
  class_type text not null check (class_type in ('video', 'livestream')),
  image_url text,
  max_participants integer not null default 30,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS on classes
alter table public.classes enable row level security;

-- Classes policies
create policy "Anyone can view classes"
  on public.classes for select
  using (true);

create policy "Admins can insert classes"
  on public.classes for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update classes"
  on public.classes for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete classes"
  on public.classes for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Create class_registrations table
create table public.class_registrations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  registered_at timestamp with time zone default now() not null,
  unique (class_id, user_id)
);

-- Enable RLS on class_registrations
alter table public.class_registrations enable row level security;

-- Class registrations policies
create policy "Anyone can view class registrations"
  on public.class_registrations for select
  using (true);

create policy "Users can register for classes"
  on public.class_registrations for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel class registrations"
  on public.class_registrations for delete
  using (auth.uid() = user_id);

-- Create function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at triggers
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

create trigger handle_classes_updated_at
  before update on public.classes
  for each row execute function public.handle_updated_at();