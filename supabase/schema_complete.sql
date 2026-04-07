-- =====================================================
-- LINKUP - BASE DE DONNÉES COMPLETE (Supabase)
-- Fichier: supabase/schema_complete.sql
-- Description: Schéma complet pour l'application LinkUp
-- =====================================================

-- Note: Ce fichier doit être exécuté dans l'éditeur SQL de Supabase
-- =====================================================

-- =====================================================
-- 1. PROFILS ET AUTHENTIFICATION
-- =====================================================

-- Table des profils (extension de auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  cover_url text, -- Photo de couverture
  -- Student fields (optional)
  is_student boolean default null,
  university text,
  field_of_study text,
  year_of_study integer,
  -- Onboarding tracking
  has_completed_onboarding boolean default false,
  onboarding_step text default 'profile_choice',
  
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Trigger pour créer automatiquement le profil
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fonction pour mettre à jour updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create or replace trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- =====================================================
-- 2. STORIES
-- =====================================================

create table if not exists public.stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content text,
  media_url text,
  media_type text check (media_type in ('image', 'video', 'text')) default 'text',
  background_color text default '#8A2BE2',
  text_color text default '#FFFFFF',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null default (timezone('utc'::text, now()) + interval '24 hours'),
  views_count integer default 0
);

create index if not exists idx_stories_expires_at on public.stories(expires_at);
create index if not exists idx_stories_user_id on public.stories(user_id);

create table if not exists public.story_views (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references public.stories on delete cascade not null,
  viewer_id uuid references auth.users on delete cascade not null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(story_id, viewer_id)
);

create or replace function public.increment_story_views(story_id uuid)
returns void as $$
begin
  update public.stories set views_count = views_count + 1 where id = story_id;
end;
$$ language plpgsql security definer;

-- =====================================================
-- 3. POSTS, LIKES, COMMENTAIRES, PARTAGES
-- =====================================================

create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  media_urls text[],
  media_type text check (media_type in ('image', 'video', 'mixed')),
  location text,
  is_shared boolean default false,
  original_post_id uuid references public.posts on delete set null,
  share_count integer default 0,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_posts_original_post_id on public.posts(original_post_id);

create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  parent_id uuid references public.comments on delete cascade,
  likes_count integer default 0,
  replies_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_parent_id on public.comments(parent_id);

create table if not exists public.shares (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  platform text check (platform in ('whatsapp', 'app', 'copy_link', 'other')) default 'app',
  shared_to_user_id uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fonctions compteurs
create or replace function public.increment_post_likes(post_id uuid)
returns void as $$
begin
  update public.posts set likes_count = likes_count + 1 where id = post_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_post_likes(post_id uuid)
returns void as $$
begin
  update public.posts set likes_count = greatest(0, likes_count - 1) where id = post_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_post_comments(post_id uuid)
returns void as $$
begin
  update public.posts set comments_count = comments_count + 1 where id = post_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_post_comments(post_id uuid)
returns void as $$
begin
  update public.posts set comments_count = greatest(0, comments_count - 1) where id = post_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_post_shares(post_id uuid)
returns void as $$
begin
  update public.posts set share_count = share_count + 1 where id = post_id;
end;
$$ language plpgsql security definer;

-- =====================================================
-- 4. MESSAGERIE
-- =====================================================

create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);

create table if not exists public.conversation_participants (
  conversation_id uuid references public.conversations on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_read_at timestamp with time zone,
  primary key (conversation_id, user_id)
);

create index if not exists idx_conversation_participants_user_id on public.conversation_participants(user_id);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_read boolean default false,
  read_at timestamp with time zone,
  reply_to_id uuid references public.messages on delete set null,
  forwarded_from_id uuid references auth.users on delete set null,
  is_forwarded boolean default false,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone
);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id, created_at desc);
create index if not exists idx_messages_sender_id on public.messages(sender_id);

create table if not exists public.message_reactions (
  message_id uuid references public.messages on delete cascade,
  user_id uuid references auth.users on delete cascade,
  reaction text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (message_id, user_id)
);

create or replace function public.update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations set updated_at = timezone('utc'::text, now()) where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

create or replace trigger on_message_sent
  after insert on public.messages
  for each row execute procedure public.update_conversation_timestamp();

-- =====================================================
-- 5. CONTACTS ET RELATIONS
-- =====================================================

create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  contact_id uuid references auth.users on delete cascade not null,
  contact_email text,
  contact_phone text,
  display_name text,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, contact_id)
);

create index if not exists idx_contacts_user_id on public.contacts(user_id);

create table if not exists public.followers (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users on delete cascade not null,
  following_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

create index if not exists idx_followers_follower on public.followers(follower_id);
create index if not exists idx_followers_following on public.followers(following_id);

-- =====================================================
-- 6. MODULE ÉTUDIANT
-- =====================================================

create table if not exists public.student_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  type text check (type in ('filiere', 'universite', 'promo', 'club', 'custom')) default 'custom',
  university text,
  field_of_study text,
  year_of_study integer,
  avatar_url text,
  created_by uuid references auth.users on delete set null,
  member_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_student_groups_university on public.student_groups(university);
create index if not exists idx_student_groups_field on public.student_groups(field_of_study);

create table if not exists public.group_members (
  group_id uuid references public.student_groups on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text check (role in ('admin', 'moderator', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

create index if not exists idx_group_members_user_id on public.group_members(user_id);

create table if not exists public.resources (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.student_groups on delete cascade not null,
  title text not null,
  description text,
  type text check (type in ('pdf', 'link', 'note', 'image', 'other')) default 'other',
  url text,
  file_path text,
  uploaded_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_resources_group_id on public.resources(group_id);

create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text check (type in ('exam', 'rendu', 'soiree', 'reunion', 'stage', 'other')) default 'other',
  date timestamp with time zone not null,
  location text,
  group_id uuid references public.student_groups on delete set null,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_events_date on public.events(date);
create index if not exists idx_events_group_id on public.events(group_id);

create table if not exists public.job_offers (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company text not null,
  description text not null,
  location text,
  type text check (type in ('stage', 'alternance', 'cdi', 'cdd', 'job_etudiant')) default 'stage',
  posted_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  is_active boolean default true
);

create index if not exists idx_job_offers_type on public.job_offers(type);
create index if not exists idx_job_offers_expires on public.job_offers(expires_at);

-- Fonctions pour groupes
create or replace function public.increment_group_members(group_id uuid)
returns void as $$
begin
  update public.student_groups set member_count = member_count + 1 where id = group_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_group_members(group_id uuid)
returns void as $$
begin
  update public.student_groups set member_count = greatest(0, member_count - 1) where id = group_id;
end;
$$ language plpgsql security definer;

-- =====================================================
-- 7. NOTIFICATIONS PUSH
-- =====================================================

create table if not exists public.push_tokens (
  user_id uuid references auth.users on delete cascade primary key,
  token text not null,
  platform text check (platform in ('ios', 'android', 'web')) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.notification_settings (
  user_id uuid references auth.users on delete cascade primary key,
  new_messages boolean default true,
  new_followers boolean default true,
  post_likes boolean default false,
  post_comments boolean default true,
  mentions boolean default true,
  events boolean default true,
  job_offers boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.handle_new_user_notifications()
returns trigger as $$
begin
  insert into public.notification_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created_notifications
  after insert on auth.users
  for each row execute procedure public.handle_new_user_notifications();

-- =====================================================
-- 8. POLITIQUES RLS (Row Level Security)
-- =====================================================

alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.shares enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.contacts enable row level security;
alter table public.followers enable row level security;
alter table public.student_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.resources enable row level security;
alter table public.events enable row level security;
alter table public.job_offers enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_settings enable row level security;

-- Policies Profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Policies Stories
create policy "Stories are viewable by everyone"
  on public.stories for select using (expires_at > timezone('utc'::text, now()));

create policy "Users can insert own stories"
  on public.stories for insert with check (auth.uid() = user_id);

create policy "Users can delete own stories"
  on public.stories for delete using (auth.uid() = user_id);

-- Policies Posts
create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Users can insert own posts"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.posts for update using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = user_id);

-- Policies Likes
create policy "Likes are viewable by everyone"
  on public.likes for select using (true);

create policy "Users can manage own likes"
  on public.likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies Comments
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

create policy "Users can insert own comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- Policies Conversations
create policy "Users can view their conversations"
  on public.conversations for select using (
    exists (select 1 from public.conversation_participants
      where conversation_id = id and user_id = auth.uid())
  );

-- Policies Messages
create policy "Users can view messages in their conversations"
  on public.messages for select using (
    exists (select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid())
  );

create policy "Users can insert messages in their conversations"
  on public.messages for insert with check (
    sender_id = auth.uid() and
    exists (select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid())
  );

-- Policies Groups
create policy "Groups are viewable by everyone"
  on public.student_groups for select using (true);

create policy "Users can create groups"
  on public.student_groups for insert with check (auth.uid() = created_by);

-- Policies Group Members
create policy "Group members are viewable by everyone"
  on public.group_members for select using (true);

-- Policies Resources
create policy "Resources are viewable by group members"
  on public.resources for select using (
    exists (select 1 from public.group_members
      where group_id = resources.group_id and user_id = auth.uid())
  );

-- Policies Notifications
create policy "Users can view own notification settings"
  on public.notification_settings for select using (auth.uid() = user_id);

create policy "Users can update own notification settings"
  on public.notification_settings for update using (auth.uid() = user_id);

create policy "Users can manage own push token"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================
-- 9. VUES UTILES
-- =====================================================

create or replace view public.feed_posts as
select 
  p.*,
  pr.username,
  pr.full_name as author_name,
  pr.avatar_url as author_avatar,
  exists (
    select 1 from public.likes l 
    where l.post_id = p.id and l.user_id = auth.uid()
  ) as has_liked
from public.posts p
left join public.profiles pr on p.user_id = pr.id
order by p.created_at desc;

create or replace view public.conversation_list as
select 
  c.id,
  c.created_at,
  c.updated_at,
  (
    select json_agg(
      json_build_object(
        'id', pr.id,
        'username', pr.username,
        'full_name', pr.full_name,
        'avatar_url', pr.avatar_url
      )
    )
    from public.conversation_participants cp2
    left join public.profiles pr on cp2.user_id = pr.id
    where cp2.conversation_id = c.id
  ) as participants,
  (
    select row_to_json(m.*)
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) as last_message
from public.conversations c
join public.conversation_participants cp on c.id = cp.conversation_id
where cp.user_id = auth.uid()
order by c.updated_at desc;

create or replace view public.profile_stats as
select 
  p.id as profile_id,
  (select count(*) from public.posts where user_id = p.id) as posts_count,
  (select count(*) from public.followers where following_id = p.id) as followers_count,
  (select count(*) from public.followers where follower_id = p.id) as following_count,
  (select count(*) from public.likes l join public.posts po on l.post_id = po.id where po.user_id = p.id) as total_likes
from public.profiles p;

-- =====================================================
-- 10. DONNÉES DE TEST
-- =====================================================

create table if not exists public.universities (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  city text,
  country text default 'France',
  logo_url text
);

insert into public.universities (name, city) values
  ('Université Paris-Saclay', 'Paris'),
  ('Sorbonne Université', 'Paris'),
  ('Université de Lyon', 'Lyon'),
  ('Université de Bordeaux', 'Bordeaux'),
  ('Université de Toulouse', 'Toulouse'),
  ('Université d Aix-Marseille', 'Marseille'),
  ('Université de Strasbourg', 'Strasbourg'),
  ('Université de Lille', 'Lille')
on conflict (name) do nothing;

-- =====================================================
-- STORAGE BUCKETS - À créer dans le Dashboard Supabase
-- =====================================================
-- 1. avatars - pour les photos de profil
-- 2. post-images - pour les images des publications
-- 3. story-images - pour les images des stories
-- 4. cover-images - pour les photos de couverture
-- 5. resources - pour les fichiers partagés dans les groupes
-- =====================================================
