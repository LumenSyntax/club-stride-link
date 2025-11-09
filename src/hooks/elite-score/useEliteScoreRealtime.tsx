import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel(`elite_scores:${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'elite_scores',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          console.log('Elite Score updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['eliteScore', targetUserId] });
          queryClient.invalidateQueries({ queryKey: ['eliteLeaderboard'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId, queryClient]);
}
