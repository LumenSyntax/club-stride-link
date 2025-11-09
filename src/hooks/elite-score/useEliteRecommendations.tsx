import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../use-toast';
import type { EliteRecommendation } from './types';

/**
 * Hook to fetch user's recommendations
 */
export function useEliteRecommendations(userId?: string, includeCompleted: boolean = false) {
  return useQuery<EliteRecommendation[]>({
    queryKey: ['eliteRecommendations', userId, includeCompleted],
    queryFn: async () => {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      let query = supabase
        .from('elite_recommendations')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (!includeCompleted) {
        query = query.eq('completed', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: true,
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
      const { error } = await supabase
        .from('elite_recommendations')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', recommendationId);

      if (error) throw error;
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
