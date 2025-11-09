import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Award, Crown, Medal } from 'lucide-react';
import { useEliteLeaderboard } from '@/hooks/elite-score';
import type { LeaderboardEntry } from '@/hooks/elite-score';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface EliteLeaderboardProps {
  className?: string;
  showTimeframeSelector?: boolean;
  limit?: number;
}

export function EliteLeaderboard({
  className,
  showTimeframeSelector = true,
  limit = 100
}: EliteLeaderboardProps) {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('week');

  const { data: leaderboard, isLoading } = useEliteLeaderboard(timeframe, limit);

  const userEntry = leaderboard?.find(entry => entry.user_id === user?.id);

  if (isLoading) {
    return (
      <Card className={cn('border-4', className)}>
        <CardContent className="p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className={cn('border-4', className)}>
        <CardContent className="p-12 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="uppercase font-bold">NO LEADERBOARD DATA YET</p>
          <p className="text-sm">Be the first to calculate your Elite Score!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-4', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-black uppercase tracking-tight font-display">
            🏆 LEADERBOARD
          </CardTitle>
          {showTimeframeSelector && (
            <div className="flex gap-2">
              {(['day', 'week', 'month', 'all'] as const).map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className="uppercase font-bold text-xs"
                >
                  {tf === 'all' ? 'ALL TIME' : tf}
                </Button>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold">
          TOP {leaderboard.length} ATHLETES
        </p>
      </CardHeader>
      <CardContent>
        {/* User's Position (if not in top 10) */}
        {userEntry && userEntry.rank > 10 && (
          <div className="mb-4 p-4 border-4 border-primary bg-primary/10">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">YOUR POSITION</p>
            <LeaderboardRow entry={userEntry} highlight={true} />
          </div>
        )}

        <div className="space-y-0">
          {leaderboard.map((entry, index) => (
            <LeaderboardRow
              key={entry.user_id}
              entry={entry}
              highlight={entry.user_id === user?.id}
              showDivider={index < leaderboard.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  highlight?: boolean;
  showDivider?: boolean;
}

function LeaderboardRow({ entry, highlight = false, showDivider = false }: LeaderboardRowProps) {
  const rankDisplay = getRankDisplay(entry.rank);

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 transition-all hover:bg-muted/50',
        highlight && 'bg-primary/10 border-l-4 border-primary',
        showDivider && 'border-b-2 border-border'
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Rank */}
        <div className="w-12 flex items-center justify-center">
          {typeof rankDisplay === 'string' ? (
            <span className="text-3xl">{rankDisplay}</span>
          ) : (
            <span className="text-2xl font-black text-muted-foreground">
              #{entry.rank}
            </span>
          )}
        </div>

        {/* Avatar & Name */}
        <Avatar className="h-12 w-12 border-2 border-foreground">
          <AvatarImage src={entry.avatar_url || undefined} />
          <AvatarFallback className="bg-foreground text-background font-black">
            {entry.full_name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-black uppercase text-base">
              {entry.full_name || 'Anonymous Runner'}
            </h3>
            {entry.rank <= 3 && (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">
            {entry.level_tier}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        {/* Score */}
        <div className="text-right">
          <div className="text-2xl font-black">
            {(entry.temporal_score * 100).toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground uppercase font-bold">SCORE</p>
        </div>

        {/* Badges */}
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold">{entry.badge_count}</span>
          </div>
          <p className="text-xs text-muted-foreground uppercase font-bold">
            {entry.badge_count === 1 ? 'BADGE' : 'BADGES'}
          </p>
        </div>

        {/* Percentile */}
        <Badge className="text-xs font-black uppercase">
          TOP {entry.percentile}%
        </Badge>
      </div>
    </div>
  );
}

// Helper function
function getRankDisplay(rank: number): string | number {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
}

// Leaderboard Page Component (can be used as a separate page)
export function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 border-b-4 border-foreground pb-6">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight font-display mb-2">
              LEADERBOARD
            </h1>
            <p className="text-lg text-muted-foreground uppercase tracking-ultra-wide font-bold">
              SEE HOW YOU RANK AGAINST THE COMMUNITY
            </p>
          </div>

          {/* Leaderboard */}
          <EliteLeaderboard limit={100} />

          {/* Info Section */}
          <Card className="border-4 mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase tracking-wide">
                HOW RANKINGS WORK
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="font-bold uppercase text-sm">TEMPORAL SCORE</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rankings are based on your temporal Elite Score, which smooths
                    your performance over time for fair comparison.
                  </p>
                </div>

                <div className="p-4 border-2 border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-bold uppercase text-sm">TIMEFRAMES</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    View rankings by day, week, month, or all-time to see how
                    you compare across different periods.
                  </p>
                </div>

                <div className="p-4 border-2 border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Medal className="h-5 w-5 text-primary" />
                    <h3 className="font-bold uppercase text-sm">BADGES</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Earn badges by achieving milestones. Badge count is displayed
                    alongside your score in rankings.
                  </p>
                </div>

                <div className="p-4 border-2 border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="font-bold uppercase text-sm">PERCENTILE</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your percentile shows what percentage of athletes you outrank.
                    Top 10% means you're better than 90% of athletes!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
