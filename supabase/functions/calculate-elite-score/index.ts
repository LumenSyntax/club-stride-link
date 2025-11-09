import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =====================================================
// Type Definitions
// =====================================================

interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  duration: number;
  distance: number;
  calories: number | null;
  activity_date: string;
  average_pace: number | null;
  elevation_gain: number | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  strava_activity_id: number | null;
}

interface TrainingMetrics {
  totalDistance: number;
  weeklyMileage: number[];
  averagePace: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  longestRun: number;
  elevationGain: number;
  trainingLoad: number;
  recoveryScore: number;
}

interface EliteScoreSignal {
  name: string;
  value: number;
  weight: number;
  evidence: Record<string, any>;
  confidence: number;
}

interface EliteLevel {
  tier: string;
  label: string;
  icon: string;
  threshold: number;
}

// =====================================================
// Configuration
// =====================================================

const CONFIG = {
  alpha: 0.6, // Temporal smoothing factor
  minConfidence: 0.7,
  evaluationWindow: 30, // days
  signals: {
    performance: { weight: 1.5, threshold: 0.6 },
    consistency: { weight: 1.2, threshold: 0.7 },
    dataIntegrity: { weight: 1.0, threshold: 0.8 },
    progression: { weight: 1.3, threshold: 0.5 },
    engagement: { weight: 0.8, threshold: 0.6 }
  },
  levels: [
    { tier: 'PROFESSIONAL', label: 'Elite Pro', icon: '💎', threshold: 0.9 },
    { tier: 'ADVANCED', label: 'Elite Advanced', icon: '🥇', threshold: 0.75 },
    { tier: 'EMERGING', label: 'Elite Emerging', icon: '🥈', threshold: 0.6 },
    { tier: 'FOUNDATION', label: 'Elite Foundation', icon: '🥉', threshold: 0 }
  ]
};

// =====================================================
// Main Handler
// =====================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log(`Calculating Elite Score for user: ${user.id}`);

    // Fetch user's recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - CONFIG.evaluationWindow);

    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('activity_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('activity_date', { ascending: false });

    if (activitiesError) {
      throw new Error(`Failed to fetch activities: ${activitiesError.message}`);
    }

    if (!activities || activities.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No activities found',
          message: 'You need at least one activity to calculate your Elite Score'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate aggregated metrics
    const metrics = calculateMetrics(activities as Activity[]);
    console.log('Calculated metrics:', metrics);

    // Generate signals
    const signals = generateSignals(metrics, activities as Activity[]);
    console.log('Generated signals:', signals.map(s => ({ name: s.name, value: s.value })));

    // Validate with TruthSyntax (with fallback)
    const validatedSignals = await validateWithTruthSyntax(signals);
    console.log('Validated signals:', validatedSignals.map(s => ({ name: s.name, confidence: s.confidence })));

    // Calculate scores
    const instantScore = calculateInstantScore(validatedSignals);
    console.log('Instant score:', instantScore);

    const temporalScore = await calculateTemporalScore(user.id, instantScore, supabase);
    console.log('Temporal score:', temporalScore);

    // Determine level
    const level = determineLevel(temporalScore);
    console.log('Level:', level);

    // Calculate percentile
    const percentile = await calculatePercentile(temporalScore, supabase);
    console.log('Percentile:', percentile);

    // Store score in database
    const { data: scoreRecord, error: scoreError } = await supabase
      .from('elite_scores')
      .insert({
        user_id: user.id,
        instant_score: instantScore,
        temporal_score: temporalScore,
        percentile: percentile,
        level: level.tier,
        level_tier: level.label,
        next_evaluation: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          version: '1.0.0',
          activities_analyzed: activities.length,
          calculation_date: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (scoreError) {
      throw new Error(`Failed to store score: ${scoreError.message}`);
    }

    console.log('Score record created:', scoreRecord.id);

    // Store signals
    const signalsToInsert = validatedSignals.map(signal => ({
      score_id: scoreRecord.id,
      signal_name: signal.name,
      signal_value: signal.value,
      weight: signal.weight,
      confidence: signal.confidence,
      evidence: signal.evidence
    }));

    const { error: signalsError } = await supabase
      .from('elite_score_signals')
      .insert(signalsToInsert);

    if (signalsError) {
      console.error('Failed to store signals:', signalsError);
    }

    // Check and award badges
    const badges = await checkAndAwardBadges(user.id, validatedSignals, metrics, scoreRecord.id, supabase);
    console.log('Badges awarded:', badges.length);

    // Generate recommendations
    const recommendations = generateRecommendations(validatedSignals, level, metrics);

    // Store recommendations
    if (recommendations.length > 0) {
      const recsToInsert = recommendations.map(rec => ({
        score_id: scoreRecord.id,
        user_id: user.id,
        ...rec
      }));

      await supabase
        .from('elite_recommendations')
        .insert(recsToInsert);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          score: {
            instant: instantScore,
            temporal: temporalScore,
            percentile: percentile
          },
          level: level,
          signals: validatedSignals,
          badges: badges,
          recommendations: recommendations,
          nextEvaluation: scoreRecord.next_evaluation,
          activitiesAnalyzed: activities.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Elite Score calculation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =====================================================
// Calculation Functions
// =====================================================

function calculateMetrics(activities: Activity[]): TrainingMetrics {
  const runningActivities = activities.filter(a => a.activity_type === 'running');

  // Calculate total distance in meters
  const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0) * 1000;

  // Calculate weekly mileage (last 4 weeks)
  const weeklyMileage: number[] = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() - 7);

    const weekActivities = activities.filter(a => {
      const activityDate = new Date(a.activity_date);
      return activityDate >= weekEnd && activityDate < weekStart;
    });

    const weekDistance = weekActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
    weeklyMileage.unshift(weekDistance * 0.621371); // Convert km to miles
  }

  // Calculate average pace (for running activities)
  const paces = runningActivities
    .filter(a => a.average_pace && a.average_pace > 0)
    .map(a => a.average_pace!);
  const averagePace = paces.length > 0
    ? paces.reduce((sum, p) => sum + p, 0) / paces.length
    : 300; // Default 5:00/km if no pace data

  // Calculate longest run
  const longestRun = Math.max(...runningActivities.map(a => (a.distance || 0) * 1000), 0);

  // Calculate total elevation gain
  const elevationGain = activities.reduce((sum, a) => sum + (a.elevation_gain || 0), 0);

  // Calculate training load (simplified TSS-like metric)
  const trainingLoad = activities.reduce((sum, a) => {
    const duration = a.duration || 0; // in minutes
    const intensity = a.heart_rate_avg ? (a.heart_rate_avg / 180) : 0.7; // normalized intensity
    return sum + (duration * intensity);
  }, 0);

  // Recovery score (simplified based on recent activity frequency)
  const recentActivities = activities.slice(0, 7).length;
  const recoveryScore = Math.max(0, 100 - (recentActivities * 10));

  return {
    totalDistance,
    weeklyMileage,
    averagePace,
    workoutsCompleted: activities.length,
    workoutsPlanned: Math.ceil(activities.length * 1.1), // Assume 90% completion rate
    longestRun,
    elevationGain,
    trainingLoad,
    recoveryScore
  };
}

function generateSignals(metrics: TrainingMetrics, activities: Activity[]): EliteScoreSignal[] {
  const signals: EliteScoreSignal[] = [];

  // Performance Signal
  const performanceScore = calculatePerformanceScore(metrics);
  signals.push({
    name: 'performance',
    value: performanceScore,
    weight: CONFIG.signals.performance.weight,
    evidence: {
      averagePace: metrics.averagePace,
      longestRun: metrics.longestRun,
      trainingLoad: metrics.trainingLoad,
      totalDistance: metrics.totalDistance
    },
    confidence: 0.85
  });

  // Consistency Signal
  const consistencyScore = metrics.workoutsPlanned > 0
    ? Math.min(metrics.workoutsCompleted / metrics.workoutsPlanned, 1)
    : 0.5;

  signals.push({
    name: 'consistency',
    value: consistencyScore,
    weight: CONFIG.signals.consistency.weight,
    evidence: {
      workoutsCompleted: metrics.workoutsCompleted,
      workoutsPlanned: metrics.workoutsPlanned,
      completionRate: consistencyScore,
      weeklyVariance: calculateWeeklyVariance(metrics.weeklyMileage)
    },
    confidence: 0.90
  });

  // Data Integrity Signal
  const dataIntegrityScore = calculateDataIntegrityScore(activities);
  signals.push({
    name: 'dataIntegrity',
    value: dataIntegrityScore.score,
    weight: CONFIG.signals.dataIntegrity.weight,
    evidence: dataIntegrityScore.evidence,
    confidence: dataIntegrityScore.confidence
  });

  // Progression Signal
  const progressionScore = calculateProgressionScore(activities);
  signals.push({
    name: 'progression',
    value: progressionScore.score,
    weight: CONFIG.signals.progression.weight,
    evidence: progressionScore.evidence,
    confidence: 0.82
  });

  // Engagement Signal
  const engagementScore = Math.min(activities.length / 20, 1); // 20 activities in 30 days = max engagement
  signals.push({
    name: 'engagement',
    value: engagementScore,
    weight: CONFIG.signals.engagement.weight,
    evidence: {
      activitiesCount: activities.length,
      activitiesPerWeek: activities.length / 4,
      varietyScore: calculateVarietyScore(activities)
    },
    confidence: 0.88
  });

  return signals;
}

function calculatePerformanceScore(metrics: TrainingMetrics): number {
  // Pace factor: faster pace = higher score (180s/km = elite, 360s/km = beginner)
  const paceFactor = Math.max(0, Math.min(1, 1 - (metrics.averagePace - 180) / 180));

  // Volume factor: more distance = higher score (100km in 30 days = elite)
  const volumeFactor = Math.min(1, metrics.totalDistance / 100000);

  // Load factor: higher training load = higher score (500 = elite)
  const loadFactor = Math.min(1, metrics.trainingLoad / 500);

  // Weighted combination
  return (paceFactor * 0.4 + volumeFactor * 0.3 + loadFactor * 0.3);
}

function calculateDataIntegrityScore(activities: Activity[]): {
  score: number;
  confidence: number;
  evidence: Record<string, any>
} {
  if (activities.length === 0) {
    return { score: 0.5, confidence: 0.5, evidence: { reason: 'No activities' } };
  }

  // Check completeness of data
  const completeActivities = activities.filter(a =>
    a.distance &&
    a.duration &&
    a.activity_date
  );

  const completenessScore = completeActivities.length / activities.length;

  // Check for enhanced data (pace, HR, elevation)
  const enhancedActivities = activities.filter(a =>
    a.average_pace || a.heart_rate_avg || a.elevation_gain
  );

  const enhancementScore = enhancedActivities.length / activities.length;

  // Check for anomalies (impossible values)
  const anomalyCount = activities.filter(a => {
    // Impossible pace (<2:00/km for long distances)
    if (a.distance && a.distance > 5 && a.average_pace && a.average_pace < 120) return true;
    // Impossible heart rate
    if (a.heart_rate_avg && (a.heart_rate_avg < 40 || a.heart_rate_avg > 220)) return true;
    return false;
  }).length;

  const anomalyScore = 1 - (anomalyCount / activities.length);

  const finalScore = (completenessScore * 0.5 + enhancementScore * 0.3 + anomalyScore * 0.2);

  return {
    score: finalScore,
    confidence: completenessScore > 0.8 ? 0.9 : 0.7,
    evidence: {
      completeness: completenessScore,
      enhancement: enhancementScore,
      anomalies: anomalyCount,
      totalActivities: activities.length
    }
  };
}

function calculateProgressionScore(activities: Activity[]): {
  score: number;
  evidence: Record<string, any>
} {
  if (activities.length < 4) {
    return { score: 0.5, evidence: { reason: 'Insufficient data' } };
  }

  // Compare recent vs older activities
  const midpoint = Math.floor(activities.length / 2);
  const recentActivities = activities.slice(0, midpoint);
  const olderActivities = activities.slice(midpoint);

  // Calculate average pace improvement
  const recentPaces = recentActivities
    .filter(a => a.average_pace && a.average_pace > 0)
    .map(a => a.average_pace!);
  const olderPaces = olderActivities
    .filter(a => a.average_pace && a.average_pace > 0)
    .map(a => a.average_pace!);

  let paceImprovement = 0;
  if (recentPaces.length > 0 && olderPaces.length > 0) {
    const recentAvgPace = recentPaces.reduce((sum, p) => sum + p, 0) / recentPaces.length;
    const olderAvgPace = olderPaces.reduce((sum, p) => sum + p, 0) / olderPaces.length;
    paceImprovement = olderAvgPace > 0 ? (olderAvgPace - recentAvgPace) / olderAvgPace : 0;
  }

  // Calculate distance improvement
  const recentAvgDistance = recentActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / recentActivities.length;
  const olderAvgDistance = olderActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / olderActivities.length;
  const distanceImprovement = olderAvgDistance > 0 ? (recentAvgDistance - olderAvgDistance) / olderAvgDistance : 0;

  // Combine improvements
  const improvementScore = Math.max(0, Math.min(1, 0.5 + (paceImprovement * 2) + (distanceImprovement * 0.5)));

  return {
    score: improvementScore,
    evidence: {
      paceImprovement: paceImprovement,
      distanceImprovement: distanceImprovement,
      recentActivitiesCount: recentActivities.length,
      olderActivitiesCount: olderActivities.length
    }
  };
}

function calculateWeeklyVariance(weeklyMileage: number[]): number {
  if (weeklyMileage.length < 2) return 0;

  const mean = weeklyMileage.reduce((sum, val) => sum + val, 0) / weeklyMileage.length;
  const squaredDiffs = weeklyMileage.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / weeklyMileage.length;

  return variance;
}

function calculateVarietyScore(activities: Activity[]): number {
  const uniqueTypes = new Set(activities.map(a => a.activity_type));
  return Math.min(uniqueTypes.size / 4, 1); // Max score at 4+ different activity types
}

async function validateWithTruthSyntax(signals: EliteScoreSignal[]): Promise<EliteScoreSignal[]> {
  const truthSyntaxUrl = Deno.env.get('TRUTHSYNTAX_URL');
  const truthSyntaxKey = Deno.env.get('TRUTHSYNTAX_API_KEY');

  if (!truthSyntaxUrl || !truthSyntaxKey) {
    console.warn('TruthSyntax not configured, using signals as-is');
    return signals;
  }

  try {
    const response = await fetch(`${truthSyntaxUrl}/evc/evaluate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${truthSyntaxKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        signals: signals.map(s => ({
          name: s.name,
          value: s.value,
          weight: s.weight,
          evidence: JSON.stringify(s.evidence)
        })),
        alpha: CONFIG.alpha,
        thresholds: {
          allow: 0.75,
          step_up: 0.5
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('TruthSyntax validation result:', result);

      // Update confidence based on TruthSyntax aggregate score
      return signals.map(s => ({
        ...s,
        confidence: Math.min(s.confidence * result.aggregate, 1)
      }));
    } else {
      console.warn('TruthSyntax validation failed:', response.status);
    }
  } catch (error) {
    console.error('TruthSyntax validation error:', error);
  }

  // Fallback: return signals with slightly reduced confidence
  return signals.map(s => ({ ...s, confidence: s.confidence * 0.95 }));
}

function calculateInstantScore(signals: EliteScoreSignal[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    if (signal.confidence >= CONFIG.minConfidence) {
      weightedSum += signal.value * signal.weight * signal.confidence;
      totalWeight += signal.weight;
    }
  }

  return totalWeight > 0 ? Math.min(1, weightedSum / totalWeight) : 0;
}

async function calculateTemporalScore(
  userId: string,
  instantScore: number,
  supabase: any
): Promise<number> {
  const { data: lastScore } = await supabase
    .from('elite_scores')
    .select('temporal_score')
    .eq('user_id', userId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastScore) {
    return instantScore;
  }

  // Temporal smoothing
  return CONFIG.alpha * instantScore + (1 - CONFIG.alpha) * lastScore.temporal_score;
}

function determineLevel(score: number): EliteLevel {
  for (const level of CONFIG.levels) {
    if (score >= level.threshold) {
      return level;
    }
  }
  return CONFIG.levels[CONFIG.levels.length - 1];
}

async function calculatePercentile(score: number, supabase: any): Promise<number> {
  // Use the database function
  const { data, error } = await supabase.rpc('calculate_elite_percentile', { p_score: score });

  if (error) {
    console.error('Failed to calculate percentile:', error);
    return 50; // Default to median
  }

  return data || 50;
}

async function checkAndAwardBadges(
  userId: string,
  signals: EliteScoreSignal[],
  metrics: TrainingMetrics,
  scoreId: string,
  supabase: any
): Promise<any[]> {
  // Fetch all available badges
  const { data: allBadges } = await supabase
    .from('elite_badges')
    .select('*');

  if (!allBadges) return [];

  // Fetch user's existing badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const existingBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
  const newlyAwardedBadges: any[] = [];

  for (const badge of allBadges) {
    if (existingBadgeIds.has(badge.id)) continue;

    const earned = checkBadgeRequirements(badge, metrics, signals);

    if (earned) {
      const { error: awardError } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
          score_id: scoreId,
          evidence: { metrics, signals: signals.map(s => s.name) }
        });

      if (!awardError) {
        newlyAwardedBadges.push(badge);
        console.log(`Awarded badge: ${badge.name}`);
      }
    }
  }

  return newlyAwardedBadges;
}

function checkBadgeRequirements(
  badge: any,
  metrics: TrainingMetrics,
  signals: EliteScoreSignal[]
): boolean {
  const req = badge.requirements;

  // First Run badge
  if (req.activities_count && metrics.workoutsCompleted >= req.activities_count) {
    return true;
  }

  // Distance-based badges
  if (req.total_distance_km && (metrics.totalDistance / 1000) >= req.total_distance_km) {
    return true;
  }

  // Pace-based badges
  if (req.average_pace_max && metrics.averagePace <= req.average_pace_max) {
    return true;
  }

  // Tier-based badges
  if (req.elite_tier) {
    const currentTier = determineLevel(
      signals.find(s => s.name === 'performance')?.value || 0
    ).tier;
    if (currentTier === req.elite_tier) {
      return true;
    }
  }

  return false;
}

function generateRecommendations(
  signals: EliteScoreSignal[],
  level: EliteLevel,
  metrics: TrainingMetrics
): any[] {
  const recommendations: any[] = [];

  // Find weakest signal
  const weakestSignal = signals.reduce((min, s) =>
    s.value < min.value ? s : min
  );

  if (weakestSignal.value < 0.6) {
    recommendations.push({
      type: 'improvement',
      priority: 'high',
      title: `Improve your ${weakestSignal.name}`,
      description: `Your ${weakestSignal.name} score is ${(weakestSignal.value * 100).toFixed(0)}%. Focus on this area to boost your Elite Score.`,
      action_items: getActionItemsForSignal(weakestSignal.name, metrics),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  // Consistency recommendation
  const consistencySignal = signals.find(s => s.name === 'consistency');
  if (consistencySignal && consistencySignal.value < 0.8) {
    recommendations.push({
      type: 'consistency',
      priority: 'medium',
      title: 'Build a more consistent routine',
      description: 'Try to maintain a regular training schedule to improve your consistency score.',
      action_items: ['Schedule workouts in advance', 'Set weekly mileage goals', 'Track rest days'],
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return recommendations;
}

function getActionItemsForSignal(signalName: string, metrics: TrainingMetrics): string[] {
  switch (signalName) {
    case 'performance':
      return [
        'Incorporate interval training',
        'Focus on tempo runs',
        'Gradually increase weekly mileage'
      ];
    case 'consistency':
      return [
        'Set a weekly training schedule',
        'Use a training app to track workouts',
        'Join group runs for accountability'
      ];
    case 'dataIntegrity':
      return [
        'Use a GPS watch for accurate tracking',
        'Sync all activities from Strava',
        'Record heart rate data'
      ];
    case 'progression':
      return [
        'Follow a structured training plan',
        'Progressively increase distance',
        'Track your PR times'
      ];
    case 'engagement':
      return [
        'Try different types of workouts',
        'Join the community on events',
        'Set new personal goals'
      ];
    default:
      return ['Keep training and tracking your progress'];
  }
}
