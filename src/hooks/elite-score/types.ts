// =====================================================
// Elite Score Type Definitions
// =====================================================

export interface EliteScoreSignal {
  id: string;
  score_id: string;
  signal_name: string;
  signal_value: number;
  weight: number;
  confidence: number;
  evidence: any;
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
  metadata: any;
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
  requirements: any;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  score_id: string;
  earned_at: string;
  evidence: any;
  elite_badges?: EliteBadge;
}

export interface EliteRecommendation {
  id: string;
  score_id: string;
  user_id: string;
  type: string;
  priority: string;
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
