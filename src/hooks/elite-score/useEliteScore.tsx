import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../use-toast';
import type { EliteScore, CalculateScoreResponse } from './types';

/**
 * Hook to fetch the latest Elite Score for a user
 */
export function useEliteScore(userId?: string) {
  return useQuery<EliteScore | null>({
    queryKey: ['eliteScore', userId],
    queryFn: async () => {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const { data, error } = await supabase
        .from('elite_scores')
        .select(`
          *,
          elite_score_signals(*)
        `)
        .eq('user_id', targetUserId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000 // Refetch every minute
  });
}

/**
 * Hook to calculate/recalculate Elite Score
 */
export function useCalculateEliteScore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<CalculateScoreResponse, Error, void>({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('calculate-elite-score', {
        body: {}
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eliteScore'] });
      queryClient.invalidateQueries({ queryKey: ['eliteLeaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userBadges'] });

      toast({
        title: 'Elite Score Updated',
        description: `Your new score is ${(data.data.score.temporal * 100).toFixed(1)}. You're in the top ${data.data.score.percentile}%!`
      });
    },
    onError: (error) => {
      console.error('Failed to calculate Elite Score:', error);
      toast({
        title: 'Calculation Failed',
        description: error.message || 'Unable to calculate your Elite Score. Please try again.',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Hook to fetch Elite Score history for a user
 */
export function useEliteScoreHistory(userId?: string, days: number = 30) {
  return useQuery<EliteScore[]>({
    queryKey: ['eliteScoreHistory', userId, days],
    queryFn: async () => {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('elite_scores')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('calculated_at', startDate.toISOString())
        .order('calculated_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
}

/**
 * Hook to check if user needs score recalculation
 */
export function useScoreRecalculationNeeded() {
  const { data: score } = useEliteScore();

  if (!score) return true;

  const nextEvaluation = new Date(score.next_evaluation);
  const now = new Date();

  return now >= nextEvaluation;
}

/**
 * Utility hook to format Elite Score for display
 */
export function useFormattedEliteScore(userId?: string) {
  const { data: score, isLoading, error } = useEliteScore(userId);

  if (isLoading || error || !score) {
    return {
      score: null,
      isLoading,
      error,
      formatted: {
        temporal: '-',
        instant: '-',
        percentile: '-',
        level: 'Loading...',
        icon: '⏳'
      }
    };
  }

  return {
    score,
    isLoading: false,
    error: null,
    formatted: {
      temporal: (score.temporal_score * 100).toFixed(1),
      instant: (score.instant_score * 100).toFixed(1),
      percentile: score.percentile.toString(),
      level: score.level_tier,
      icon: getLevelIcon(score.level_tier)
    }
  };
}

// Helper function
function getLevelIcon(levelTier: string): string {
  const icons: Record<string, string> = {
    'Elite Pro': '💎',
    'Elite Advanced': '🥇',
    'Elite Emerging': '🥈',
    'Elite Foundation': '🥉'
  };
  return icons[levelTier] || '🏃';
}
