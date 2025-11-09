import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LeaderboardEntry } from './types';

/**
 * Hook to fetch the Elite Leaderboard
 */
export function useEliteLeaderboard(
  timeframe: 'day' | 'week' | 'month' | 'all' = 'all',
  limit: number = 100,
  offset: number = 0
) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['eliteLeaderboard', timeframe, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_elite_leaderboard', {
        p_timeframe: timeframe,
        p_limit: limit,
        p_offset: offset
      });

      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000 // Refetch every minute for live leaderboard
  });
}

/**
 * Hook to get user's rank in the leaderboard
 */
export function useUserRank(userId?: string) {
  return useQuery<{ rank: number; total: number } | null>({
    queryKey: ['userRank', userId],
    queryFn: async () => {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

      if (!targetUserId) {
        return null;
      }

      // Get all ranked users
      const { data: leaderboard } = await supabase.rpc('get_elite_leaderboard', {
        p_timeframe: 'all',
        p_limit: 10000,
        p_offset: 0
      });

      if (!leaderboard) return null;

      const userEntry = leaderboard.find((entry: LeaderboardEntry) => entry.user_id === targetUserId);

      if (!userEntry) return null;

      return {
        rank: userEntry.rank,
        total: leaderboard.length
      };
    },
    enabled: true,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
