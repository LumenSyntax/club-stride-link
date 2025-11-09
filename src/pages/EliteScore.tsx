import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  TrendingUp,
  Shield,
  Target,
  Activity,
  RefreshCw,
  Award,
  ChevronRight,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import {
  useEliteScore,
  useCalculateEliteScore,
  useEliteScoreHistory,
  useUserBadges,
  useAllBadges,
  useEliteRecommendations,
  useCompleteRecommendation,
  useFormattedEliteScore
} from '@/hooks/useEliteScore';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const EliteScore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');

  const { data: scoreData, isLoading: scoreLoading } = useEliteScore();
  const { data: historyData } = useEliteScoreHistory(undefined, selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'month' ? 30 : 90);
  const { data: userBadges } = useUserBadges();
  const { data: allBadges } = useAllBadges();
  const { data: recommendations } = useEliteRecommendations();

  const calculateScore = useCalculateEliteScore();
  const completeRecommendation = useCompleteRecommendation();
  const { formatted } = useFormattedEliteScore();

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (scoreLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Card className="border-4 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-4xl font-black uppercase tracking-tight font-display text-center">
                WELCOME TO ELITE SCORE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🏃</div>
                <h2 className="text-2xl font-bold uppercase mb-2">GET YOUR FIRST SCORE</h2>
                <p className="text-muted-foreground mb-6">
                  Calculate your Elite Score to see how you stack up against the community.
                  Track your performance, consistency, and progression over time.
                </p>
              </div>

              <div className="bg-muted p-6 border-4 border-border space-y-2">
                <h3 className="font-bold uppercase tracking-wide mb-3">ELITE SCORE MEASURES:</h3>
                <div className="space-y-2">
                  {[
                    { icon: <Trophy className="h-5 w-5" />, label: 'Performance' },
                    { icon: <Target className="h-5 w-5" />, label: 'Consistency' },
                    { icon: <Shield className="h-5 w-5" />, label: 'Data Integrity' },
                    { icon: <TrendingUp className="h-5 w-5" />, label: 'Progression' },
                    { icon: <Activity className="h-5 w-5" />, label: 'Engagement' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-semibold">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => calculateScore.mutate()}
                disabled={calculateScore.isPending}
                className="w-full uppercase tracking-ultra-wide font-black text-lg h-14"
                size="lg"
              >
                {calculateScore.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    CALCULATING...
                  </>
                ) : (
                  <>
                    <Trophy className="mr-2 h-5 w-5" />
                    CALCULATE MY SCORE
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const signals = scoreData.elite_score_signals || [];

  // Prepare chart data
  const radarData = signals.map(signal => ({
    signal: signal.signal_name.toUpperCase(),
    value: signal.signal_value * 100,
    fullMark: 100
  }));

  const lineChartData = historyData?.map(score => ({
    date: new Date(score.calculated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: score.temporal_score * 100
  })) || [];

  const handleCompleteRecommendation = (recId: string) => {
    completeRecommendation.mutate(recId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 border-b-4 border-foreground pb-6">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight font-display mb-2">
              ELITE SCORE
            </h1>
            <p className="text-lg text-muted-foreground uppercase tracking-ultra-wide font-bold">
              YOUR PERFORMANCE METRICS & INSIGHTS
            </p>
          </div>

          {/* Main Score Card */}
          <Card className="border-4 mb-8">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Score Circle */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={`${scoreData.temporal_score * 552.92} 552.92`}
                        className="text-primary transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-black">
                          {formatted.temporal}
                        </div>
                        <div className="text-sm text-muted-foreground font-bold uppercase">
                          Score
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-3xl">{formatted.icon}</span>
                    <div>
                      <div className="font-black uppercase text-lg">{scoreData.level_tier}</div>
                      <div className="text-sm text-muted-foreground font-bold">
                        Top {scoreData.percentile}%
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => calculateScore.mutate()}
                    disabled={calculateScore.isPending}
                    variant="outline"
                    className="mt-4 uppercase tracking-ultra-wide font-black"
                  >
                    <RefreshCw className={cn(
                      "mr-2 h-4 w-4",
                      calculateScore.isPending && "animate-spin"
                    )} />
                    {calculateScore.isPending ? 'CALCULATING...' : 'RECALCULATE'}
                  </Button>
                </div>

                {/* Signals Breakdown */}
                <div className="col-span-2 space-y-4">
                  <h3 className="text-xl font-black uppercase tracking-wide mb-4">
                    PERFORMANCE BREAKDOWN
                  </h3>
                  {signals.map((signal) => (
                    <div key={signal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getSignalIcon(signal.signal_name)}
                          <span className="font-bold uppercase text-sm tracking-wide">
                            {signal.signal_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground font-bold">
                            {(signal.signal_value * 100).toFixed(0)}%
                          </span>
                          <Badge variant="outline" className="text-xs font-bold">
                            {(signal.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={signal.signal_value * 100}
                        className="h-3"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Different Views */}
          <Tabs defaultValue="progress" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-14">
              <TabsTrigger value="progress" className="uppercase font-black text-sm">
                Progress
              </TabsTrigger>
              <TabsTrigger value="badges" className="uppercase font-black text-sm">
                Badges
              </TabsTrigger>
              <TabsTrigger value="insights" className="uppercase font-black text-sm">
                Insights
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="uppercase font-black text-sm">
                Recommendations
              </TabsTrigger>
            </TabsList>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <Card className="border-4">
                  <CardHeader>
                    <CardTitle className="text-xl font-black uppercase tracking-wide">
                      SCORE PROGRESSION
                    </CardTitle>
                    <div className="flex gap-2">
                      {['week', 'month', 'all'].map((tf) => (
                        <Button
                          key={tf}
                          variant={selectedTimeframe === tf ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTimeframe(tf as any)}
                          className="uppercase font-bold text-xs"
                        >
                          {tf === 'all' ? '3 MONTHS' : tf}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {lineChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                          <YAxis domain={[0, 100]} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p className="uppercase font-bold">No history data yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Radar Chart */}
                <Card className="border-4">
                  <CardHeader>
                    <CardTitle className="text-xl font-black uppercase tracking-wide">
                      SIGNAL ANALYSIS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="signal" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Earned Badges */}
                <Card className="border-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-black uppercase tracking-wide">
                        MY BADGES ({userBadges?.length || 0})
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {userBadges && userBadges.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {userBadges.map((userBadge) => (
                          <div
                            key={userBadge.id}
                            className="p-4 border-4 border-primary bg-primary/10 text-center hover:scale-105 transition-transform"
                          >
                            <div className="text-4xl mb-2">{userBadge.elite_badges?.icon}</div>
                            <h4 className="font-black uppercase text-sm mb-1">
                              {userBadge.elite_badges?.name}
                            </h4>
                            <p className="text-xs text-muted-foreground font-semibold">
                              {new Date(userBadge.earned_at).toLocaleDateString()}
                            </p>
                            <Badge className="mt-2 text-xs font-bold uppercase">
                              {userBadge.elite_badges?.rarity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="uppercase font-bold">NO BADGES YET</p>
                        <p className="text-sm">Keep training to earn your first badge!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Badges */}
                <Card className="border-4">
                  <CardHeader>
                    <CardTitle className="text-xl font-black uppercase tracking-wide">
                      ALL BADGES ({allBadges?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {allBadges?.map((badge) => {
                        const earned = userBadges?.some(ub => ub.badge_id === badge.id);
                        return (
                          <div
                            key={badge.id}
                            className={cn(
                              "p-4 border-4 text-center transition-all",
                              earned
                                ? "border-primary bg-primary/10"
                                : "border-muted bg-muted/30 opacity-60"
                            )}
                          >
                            <div className="relative">
                              <div className="text-4xl mb-2">{badge.icon}</div>
                              {!earned && (
                                <Lock className="absolute top-0 right-0 h-5 w-5 text-muted-foreground" />
                              )}
                              {earned && (
                                <Unlock className="absolute top-0 right-0 h-5 w-5 text-primary" />
                              )}
                            </div>
                            <h4 className="font-black uppercase text-xs mb-1">
                              {badge.name}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {badge.description}
                            </p>
                            <Badge variant="outline" className="text-xs font-bold uppercase">
                              {badge.points} pts
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-4">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase">INSTANT SCORE</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black">
                      {(scoreData.instant_score * 100).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground uppercase font-bold mt-1">
                      Current session performance
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-4">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase">TEMPORAL SCORE</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black">
                      {(scoreData.temporal_score * 100).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground uppercase font-bold mt-1">
                      Smoothed over time
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-4">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase">RANK</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black">
                      #{scoreData.percentile}
                    </div>
                    <p className="text-xs text-muted-foreground uppercase font-bold mt-1">
                      Top {scoreData.percentile}% of athletes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Signal Details */}
              <Card className="border-4">
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-wide">
                    DETAILED SIGNAL EVIDENCE
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {signals.map((signal) => (
                    <details key={signal.id} className="border-2 border-border p-4">
                      <summary className="font-bold uppercase cursor-pointer hover:text-primary">
                        {signal.signal_name} - {(signal.signal_value * 100).toFixed(0)}%
                      </summary>
                      <div className="mt-4 bg-muted p-4 rounded">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(signal.evidence, null, 2)}
                        </pre>
                      </div>
                    </details>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6">
              <Card className="border-4">
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-wide">
                    PERSONALIZED RECOMMENDATIONS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recommendations && recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-4 border-4 border-border hover:border-primary transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <Badge
                                variant={
                                  rec.priority === 'critical' || rec.priority === 'high'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="mb-2 uppercase font-bold text-xs"
                              >
                                {rec.priority}
                              </Badge>
                              <h3 className="font-black uppercase text-lg">{rec.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {rec.description}
                              </p>
                            </div>
                            {!rec.completed && (
                              <Button
                                onClick={() => handleCompleteRecommendation(rec.id)}
                                variant="outline"
                                size="sm"
                                className="uppercase font-black"
                              >
                                COMPLETE
                              </Button>
                            )}
                          </div>
                          {rec.action_items && rec.action_items.length > 0 && (
                            <ul className="mt-3 space-y-1">
                              {rec.action_items.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                                  <span className="font-semibold">{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="uppercase font-bold">NO RECOMMENDATIONS YET</p>
                      <p className="text-sm">Keep tracking your activities to get personalized insights!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

// Helper function to get signal icons
function getSignalIcon(signalName: string) {
  const icons = {
    performance: <Trophy className="w-4 h-4" />,
    consistency: <Target className="w-4 h-4" />,
    dataIntegrity: <Shield className="w-4 h-4" />,
    progression: <TrendingUp className="w-4 h-4" />,
    engagement: <Activity className="w-4 h-4" />
  };
  return icons[signalName as keyof typeof icons] || null;
}

export default EliteScore;
