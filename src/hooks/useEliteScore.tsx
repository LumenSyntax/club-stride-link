import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

// =====================================================
// Type Definitions
// =====================================================

export interface EliteScoreSignal {
  id: string;
  score_id: string;
  signal_name: string;
  signal_value: number;
  weight: number;
  confidence: number;
  evidence: Record<string, any>;
  created_at: string;
}

export interface EliteScore {
  id: string;
  user_id: string;
  instant_score: number;
  temporal_score: number;
  percentile: number;
  level: string;
  level_tier: string;
  calculated_at: string;
  next_evaluation: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  elite_score_signals?: EliteScoreSignal[];
}

export interface EliteBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: string;
  requirements: Record<string, any>;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  score_id: string;
  earned_at: string;
  evidence: Record<string, any>;
  elite_badges?: EliteBadge;
}

export interface EliteRecommendation {
  id: string;
  score_id: string;
  user_id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action_items: string[];
  completed: boolean;
  completed_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string;
  temporal_score: number;
  percentile: number;
  level: string;
  level_tier: string;
  badge_count: number;
  rank: number;
}

export interface CalculateScoreResponse {
  success: boolean;
  data: {
    score: {
      instant: number;
      temporal: number;
      percentile: number;
    };
    level: {
      tier: string;
      label: string;
      icon: string;
      threshold: number;
    };
    signals: Array<{
      name: string;
      value: number;
      weight: number;
      confidence: number;
      evidence: any;
    }>;
    badges: EliteBadge[];
    recommendations: EliteRecommendation[];
    nextEvaluation: string;
    activitiesAnalyzed: number;
  };
}

// =====================================================
// Custom Hooks
// =====================================================

/**
 * Hook to fetch the latest Elite Score for a user
 */
export function useEliteScore(userId?: string) {
  return useQuery<EliteScore | null>({
    queryKey: ['eliteScore', userId],
    queryFn: async () => {
      // Elite Score feature not yet implemented in database
      return null;
    },
    enabled: false,
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
      // Elite Score feature not yet implemented in database
      return [];
    },
    enabled: false,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
}

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
      // Elite Score feature not yet implemented in database
      return [];
    },
    enabled: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000 // Refetch every minute for live leaderboard
  });
}

/**
 * Hook to fetch user's badges
 */
export function useUserBadges(userId?: string) {
  return useQuery<UserBadge[]>({
    queryKey: ['userBadges', userId],
    queryFn: async () => {
      // Elite Score feature not yet implemented in database
      return [];
    },
    enabled: false,
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
      // Elite Score feature not yet implemented in database
      return [];
    },
    enabled: false,
    staleTime: 30 * 60 * 1000 // 30 minutes - badges don't change often
  });
}

/**
 * Hook to fetch user's recommendations
 */
export function useEliteRecommendations(userId?: string, includeCompleted: boolean = false) {
  return useQuery<EliteRecommendation[]>({
    queryKey: ['eliteRecommendations', userId, includeCompleted],
    queryFn: async () => {
      // Elite Score feature not yet implemented in database
      return [];
    },
    enabled: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Hook to mark a recommendation as completed
 */
export function useCompleteRecommendation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (recommendationId: string) => {
      // Elite Score feature not yet implemented in database
      throw new Error('Elite Score feature not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eliteRecommendations'] });
      toast({
        title: 'Recommendation Completed',
        description: 'Great job on completing this recommendation!'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

/**
 * Hook to get user's rank in the leaderboard
 */
export function useUserRank(userId?: string) {
  return useQuery<{ rank: number; total: number } | null>({
    queryKey: ['userRank', userId],
    queryFn: async () => {
      // Elite Score feature not yet implemented in database
      return null;
    },
    enabled: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
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

// =====================================================
// Helper Functions
// =====================================================

function getLevelIcon(levelTier: string): string {
  const icons: Record<string, string> = {
    'Elite Pro': '💎',
    'Elite Advanced': '🥇',
    'Elite Emerging': '🥈',
    'Elite Foundation': '🥉'
  };
  return icons[levelTier] || '🏃';
}

// =====================================================
// Realtime Subscription Hook (Optional - for live updates)
// =====================================================

/**
 * Hook to subscribe to realtime Elite Score updates
 */
export function useEliteScoreRealtime(userId?: string) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => (await supabase.auth.getUser()).data.user
  });

  const targetUserId = userId || user?.id;

  // Disabled - Elite Score feature not yet implemented
  return null;
}
