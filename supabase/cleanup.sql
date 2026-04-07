-- =====================================================
-- LINKUP - SCRIPT DE NETTOYAGE COMPLET
-- Fichier: supabase/cleanup.sql
-- Description: Supprime TOUTES les tables, fonctions, triggers
-- ATTENTION: IRREVERSIBLE - Toutes les données seront perdues!
-- =====================================================

-- =====================================================
-- 1. SUPPRIMER LES VUES (en premier)
-- =====================================================
drop view if exists public.feed_posts cascade;
drop view if exists public.conversation_list cascade;
drop view if exists public.profile_stats cascade;

-- =====================================================
-- 2. SUPPRIMER LES POLITIQUES RLS
-- =====================================================
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Stories are viewable by everyone" on public.stories;
drop policy if exists "Users can insert own stories" on public.stories;
drop policy if exists "Users can delete own stories" on public.stories;
drop policy if exists "Posts are viewable by everyone" on public.posts;
drop policy if exists "Users can insert own posts" on public.posts;
drop policy if exists "Users can update own posts" on public.posts;
drop policy if exists "Users can delete own posts" on public.posts;
drop policy if exists "Likes are viewable by everyone" on public.likes;
drop policy if exists "Users can manage own likes" on public.likes;
drop policy if exists "Comments are viewable by everyone" on public.comments;
drop policy if exists "Users can insert own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;
drop policy if exists "Users can view their conversations" on public.conversations;
drop policy if exists "Users can view messages in their conversations" on public.messages;
drop policy if exists "Users can insert messages in their conversations" on public.messages;
drop policy if exists "Groups are viewable by everyone" on public.student_groups;
drop policy if exists "Users can create groups" on public.student_groups;
drop policy if exists "Group members are viewable by everyone" on public.group_members;
drop policy if exists "Resources are viewable by group members" on public.resources;
drop policy if exists "Users can view own notification settings" on public.notification_settings;
drop policy if exists "Users can update own notification settings" on public.notification_settings;
drop policy if exists "Users can manage own push token" on public.push_tokens;

-- =====================================================
-- 3. DESACTIVER RLS SUR LES TABLES
-- =====================================================
alter table if exists public.profiles disable row level security;
alter table if exists public.stories disable row level security;
alter table if exists public.story_views disable row level security;
alter table if exists public.posts disable row level security;
alter table if exists public.likes disable row level security;
alter table if exists public.comments disable row level security;
alter table if exists public.shares disable row level security;
alter table if exists public.conversations disable row level security;
alter table if exists public.conversation_participants disable row level security;
alter table if exists public.messages disable row level security;
alter table if exists public.message_reactions disable row level security;
alter table if exists public.contacts disable row level security;
alter table if exists public.followers disable row level security;
alter table if exists public.student_groups disable row level security;
alter table if exists public.group_members disable row level security;
alter table if exists public.resources disable row level security;
alter table if exists public.events disable row level security;
alter table if exists public.job_offers disable row level security;
alter table if exists public.push_tokens disable row level security;
alter table if exists public.notification_settings disable row level security;

-- =====================================================
-- 4. SUPPRIMER LES TRIGGERS
-- =====================================================
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_notifications on auth.users;
drop trigger if exists on_profile_updated on public.profiles;
drop trigger if exists on_message_sent on public.messages;

-- =====================================================
-- 5. SUPPRIMER LES FONCTIONS
-- =====================================================
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_new_user_notifications() cascade;
drop function if exists public.handle_updated_at() cascade;
drop function if exists public.increment_story_views(uuid) cascade;
drop function if exists public.increment_post_likes(uuid) cascade;
drop function if exists public.decrement_post_likes(uuid) cascade;
drop function if exists public.increment_post_comments(uuid) cascade;
drop function if exists public.decrement_post_comments(uuid) cascade;
drop function if exists public.increment_post_shares(uuid) cascade;
drop function if exists public.update_conversation_timestamp() cascade;
drop function if exists public.increment_group_members(uuid) cascade;
drop function if exists public.decrement_group_members(uuid) cascade;

-- =====================================================
-- 6. SUPPRIMER LES INDEX
-- =====================================================
drop index if exists idx_stories_expires_at;
drop index if exists idx_stories_user_id;
drop index if exists idx_posts_created_at;
drop index if exists idx_posts_user_id;
drop index if exists idx_posts_original_post_id;
drop index if exists idx_comments_post_id;
drop index if exists idx_comments_parent_id;
drop index if exists idx_conversations_updated_at;
drop index if exists idx_conversation_participants_user_id;
drop index if exists idx_messages_conversation_id;
drop index if exists idx_messages_sender_id;
drop index if exists idx_contacts_user_id;
drop index if exists idx_followers_follower;
drop index if exists idx_followers_following;
drop index if exists idx_student_groups_university;
drop index if exists idx_student_groups_field;
drop index if exists idx_group_members_user_id;
drop index if exists idx_resources_group_id;
drop index if exists idx_events_date;
drop index if exists idx_events_group_id;
drop index if exists idx_job_offers_type;
drop index if exists idx_job_offers_expires;

-- =====================================================
-- 7. SUPPRIMER LES TABLES (ordre inverse des dépendances)
-- =====================================================

-- 7.1 Messagerie (tables avec dépendances)
drop table if exists public.message_reactions cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversation_participants cascade;
drop table if exists public.conversations cascade;

-- 7.2 Publications
drop table if exists public.shares cascade;
drop table if exists public.likes cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;

-- 7.3 Stories
drop table if exists public.story_views cascade;
drop table if exists public.stories cascade;

-- 7.4 Module étudiant
drop table if exists public.resources cascade;
drop table if exists public.events cascade;
drop table if exists public.job_offers cascade;
drop table if exists public.group_members cascade;
drop table if exists public.student_groups cascade;

-- 7.5 Contacts et relations
drop table if exists public.followers cascade;
drop table if exists public.contacts cascade;

-- 7.6 Notifications
drop table if exists public.notification_settings cascade;
drop table if exists public.push_tokens cascade;

-- 7.7 Données de test
drop table if exists public.universities cascade;

-- 7.8 Profils (en dernier)
drop table if exists public.profiles cascade;

-- =====================================================
-- 8. CONFIRMATION
-- =====================================================
do $$
begin
  raise notice '✅ NETTOYAGE TERMINÉ!';
  raise notice '🗑️ Toutes les tables ont été supprimées';
  raise notice '🗑️ Toutes les fonctions ont été supprimées';
  raise notice '🗑️ Tous les triggers ont été supprimés';
  raise notice '🗑️ Toutes les policies RLS ont été supprimées';
  raise notice '';
  raise notice '📝 Vous pouvez maintenant exécuter votre schéma SQL pour recréer la base';
end $$;
