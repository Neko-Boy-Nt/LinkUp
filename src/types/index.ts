export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  // Student fields (optional)
  is_student: boolean | null;  // null = not chosen yet, true = student, false = non-student
  university: string | null;
  field_of_study: string | null;
  year_of_study: number | null;
  // Onboarding tracking
  has_completed_onboarding: boolean;
  onboarding_step: 'profile_choice' | 'student_info' | 'username' | 'complete';
  
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
  likes: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  reply_to_id: string | null;
  reply_to?: Message;
  forwarded_from_id: string | null;
  forwarded_from?: Profile;
  is_forwarded: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  sender?: Profile;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  profile?: Profile;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  contact_email: string | null;
  contact_phone: string | null;
  display_name: string | null;
  added_at: string;
  profile?: Profile;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants?: Profile[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface StudentGroup {
  id: string;
  name: string;
  description: string | null;
  type: 'filiere' | 'universite' | 'promo' | 'club' | 'custom';
  university: string | null;
  field_of_study: string | null;
  year_of_study: number | null;
  avatar_url: string | null;
  created_by: string;
  member_count: number;
  created_at: string;
  updated_at: string;
  is_member?: boolean;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface Resource {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  type: 'pdf' | 'link' | 'note' | 'image' | 'other';
  url: string | null;
  file_path: string | null;
  uploaded_by: string;
  created_at: string;
  profile?: Profile;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  type: 'exam' | 'rendu' | 'soiree' | 'reunion' | 'stage' | 'other';
  date: string;
  location: string | null;
  group_id: string | null;
  created_by: string;
  created_at: string;
  profile?: Profile;
}

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  type: 'stage' | 'alternance' | 'cdi' | 'cdd' | 'job_etudiant';
  posted_by: string;
  created_at: string;
  expires_at: string | null;
  profile?: Profile;
}

// Social Features - Stories
export interface Story {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text';
  background_color: string | null;
  text_color: string | null;
  created_at: string;
  expires_at: string;
  views_count: number;
  profile?: Profile;
  has_viewed?: boolean;
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  profile?: Profile;
}

// Posts & Social Interactions
export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[] | null;
  media_type: 'image' | 'video' | 'mixed' | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  original_post_id: string | null;
  share_count: number;
  likes_count: number;
  comments_count: number;
  profile?: Profile;
  original_post?: Post;
  has_liked?: boolean;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null; // For nested replies
  created_at: string;
  updated_at: string;
  likes_count: number;
  replies_count: number;
  profile?: Profile;
  parent?: Comment;
  replies?: Comment[];
}

export interface Share {
  id: string;
  post_id: string;
  user_id: string;
  platform: 'whatsapp' | 'app' | 'copy_link' | 'other';
  shared_to_user_id: string | null; // If shared to specific user in app
  created_at: string;
  profile?: Profile;
}
