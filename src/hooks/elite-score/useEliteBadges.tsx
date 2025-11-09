import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EliteBadge, UserBadge } from './types';

/**
 * Hook to fetch user's badges
 */
export function useUserBadges(userId?: string) {
  return useQuery<UserBadge[]>({
    queryKey: ['userBadges', userId],
    queryFn: async () => {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          elite_badges(*)
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Hook to fetch all available badges
 */
export function useAllBadges() {
  return useQuery<EliteBadge[]>({
    queryKey: ['allBadges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('elite_badges')
        .select('*')
        .order('points', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 30 * 60 * 1000 // 30 minutes - badges don't change often
  });
}
