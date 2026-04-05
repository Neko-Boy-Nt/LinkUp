import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { StudentGroup, GroupMember, Profile } from '../types';
import { useAuth } from '../providers/AuthProvider';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all groups
  const loadGroups = useCallback(async (filters?: { university?: string; type?: string }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('student_groups')
        .select('*')
        .order('member_count', { ascending: false });

      if (filters?.university) {
        query = query.eq('university', filters.university);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load groups where user is member
  const loadMyGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('group:student_groups(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      const myGroupData = data?.map((item: any) => item.group) || [];
      setMyGroups(myGroupData);
    } catch (error) {
      console.error('Error loading my groups:', error);
    }
  }, [user]);

  // Create new group
  const createGroup = useCallback(async (groupData: {
    name: string;
    description?: string;
    type: 'filiere' | 'universite' | 'promo' | 'club' | 'custom';
    university?: string;
    field_of_study?: string;
    year_of_study?: number;
  }): Promise<StudentGroup | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('student_groups')
        .insert({
          ...groupData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin
      await supabase.from('group_members').insert({
        group_id: data.id,
        user_id: user.id,
        role: 'admin',
      });

      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }, [user]);

  // Join group
  const joinGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      });

      if (error) throw error;

      // Increment member count
      await supabase.rpc('increment_group_members', { group_id: groupId });
      
      await loadMyGroups();
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      return false;
    }
  }, [user, loadMyGroups]);

  // Leave group
  const leaveGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Decrement member count
      await supabase.rpc('decrement_group_members', { group_id: groupId });
      
      await loadMyGroups();
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  }, [user, loadMyGroups]);

  useEffect(() => {
    loadGroups();
    loadMyGroups();
  }, [loadGroups, loadMyGroups]);

  return {
    groups,
    myGroups,
    loading,
    loadGroups,
    loadMyGroups,
    createGroup,
    joinGroup,
    leaveGroup,
  };
}

// Hook for managing a specific group (admin functions)
export function useGroupManagement(groupId: string) {
  const { user, profile } = useAuth();
  const [group, setGroup] = useState<StudentGroup | null>(null);
  const [members, setMembers] = useState<(GroupMember & { profile: Profile })[]>([]);
  const [myRole, setMyRole] = useState<'admin' | 'moderator' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      // Load group details
      const { data: groupData, error: groupError } = await supabase
        .from('student_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Load members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Find my role
      const myMembership = membersData?.find((m: any) => m.user_id === user?.id);
      setMyRole(myMembership?.role || null);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user?.id]);

  // Admin: Change member role
  const updateMemberRole = useCallback(async (
    memberUserId: string, 
    newRole: 'admin' | 'moderator' | 'member'
  ): Promise<boolean> => {
    if (!groupId || !user || (myRole !== 'admin' && myRole !== 'moderator')) return false;
    
    // Moderators can only change members to moderator, not admin
    if (myRole === 'moderator' && newRole === 'admin') return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('group_id', groupId)
        .eq('user_id', memberUserId);

      if (error) throw error;
      await loadGroup();
      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    }
  }, [groupId, user, myRole, loadGroup]);

  // Admin: Remove member
  const removeMember = useCallback(async (memberUserId: string): Promise<boolean> => {
    if (!groupId || !user || myRole !== 'admin') return false;
    
    // Can't remove yourself
    if (memberUserId === user.id) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberUserId);

      if (error) throw error;

      await supabase.rpc('decrement_group_members', { group_id: groupId });
      await loadGroup();
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  }, [groupId, user, myRole, loadGroup]);

  // Admin: Update group info
  const updateGroup = useCallback(async (updates: Partial<StudentGroup>): Promise<boolean> => {
    if (!groupId || !user || myRole !== 'admin') return false;

    try {
      const { error } = await supabase
        .from('student_groups')
        .update(updates)
        .eq('id', groupId);

      if (error) throw error;
      await loadGroup();
      return true;
    } catch (error) {
      console.error('Error updating group:', error);
      return false;
    }
  }, [groupId, user, myRole, loadGroup]);

  // Admin: Delete group
  const deleteGroup = useCallback(async (): Promise<boolean> => {
    if (!groupId || !user || myRole !== 'admin') return false;

    try {
      const { error } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      return false;
    }
  }, [groupId, user, myRole]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  return {
    group,
    members,
    myRole,
    isAdmin: myRole === 'admin',
    isModerator: myRole === 'moderator' || myRole === 'admin',
    loading,
    loadGroup,
    updateMemberRole,
    removeMember,
    updateGroup,
    deleteGroup,
  };
}
