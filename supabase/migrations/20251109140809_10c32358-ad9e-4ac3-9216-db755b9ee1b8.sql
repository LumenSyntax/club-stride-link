-- =====================================================
-- ELITE SCORE SYSTEM - Complete Database Schema
-- =====================================================

-- Create elite_scores table
CREATE TABLE IF NOT EXISTS public.elite_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instant_score NUMERIC(5,4) NOT NULL CHECK (instant_score >= 0 AND instant_score <= 1),
  temporal_score NUMERIC(5,4) NOT NULL CHECK (temporal_score >= 0 AND temporal_score <= 1),
  percentile NUMERIC(5,2) NOT NULL CHECK (percentile >= 0 AND percentile <= 100),
  level TEXT NOT NULL CHECK (level IN ('foundation', 'emerging', 'advanced', 'pro')),
  level_tier TEXT NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_evaluation TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create elite_score_signals table
CREATE TABLE IF NOT EXISTS public.elite_score_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id UUID NOT NULL REFERENCES public.elite_scores(id) ON DELETE CASCADE,
  signal_name TEXT NOT NULL,
  signal_value NUMERIC NOT NULL,
  weight NUMERIC(3,2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create elite_badges table
CREATE TABLE IF NOT EXISTS public.elite_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('performance', 'consistency', 'achievement', 'milestone', 'special')),
  points INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirements JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.elite_badges(id) ON DELETE CASCADE,
  score_id UUID REFERENCES public.elite_scores(id) ON DELETE SET NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  evidence JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

-- Create elite_recommendations table
CREATE TABLE IF NOT EXISTS public.elite_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id UUID NOT NULL REFERENCES public.elite_scores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('training', 'recovery', 'nutrition', 'technique', 'goal')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_items TEXT[] NOT NULL DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_elite_scores_user_id ON public.elite_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_elite_scores_calculated_at ON public.elite_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_elite_scores_temporal_score ON public.elite_scores(temporal_score DESC);
CREATE INDEX IF NOT EXISTS idx_elite_score_signals_score_id ON public.elite_score_signals(score_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_elite_recommendations_user_id ON public.elite_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_elite_recommendations_completed ON public.elite_recommendations(completed, expires_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.elite_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elite_score_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elite_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elite_recommendations ENABLE ROW LEVEL SECURITY;

-- elite_scores policies
CREATE POLICY "Users can view own elite scores"
  ON public.elite_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own elite scores"
  ON public.elite_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all elite scores"
  ON public.elite_scores FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- elite_score_signals policies
CREATE POLICY "Users can view own score signals"
  ON public.elite_score_signals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.elite_scores
    WHERE elite_scores.id = elite_score_signals.score_id
    AND elite_scores.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all score signals"
  ON public.elite_score_signals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- elite_badges policies (public read)
CREATE POLICY "Anyone can view badges"
  ON public.elite_badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.elite_badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- user_badges policies
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all user badges for leaderboard"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can view all user badges"
  ON public.user_badges FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- elite_recommendations policies
CREATE POLICY "Users can view own recommendations"
  ON public.elite_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON public.elite_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all recommendations"
  ON public.elite_recommendations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

CREATE TRIGGER update_elite_scores_updated_at
  BEFORE UPDATE ON public.elite_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- RPC FUNCTION: Get Elite Leaderboard
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_elite_leaderboard(
  p_timeframe TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  temporal_score NUMERIC,
  percentile NUMERIC,
  level TEXT,
  level_tier TEXT,
  badge_count BIGINT,
  rank BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_filter TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate date filter based on timeframe
  CASE p_timeframe
    WHEN 'day' THEN
      v_date_filter := now() - interval '1 day';
    WHEN 'week' THEN
      v_date_filter := now() - interval '7 days';
    WHEN 'month' THEN
      v_date_filter := now() - interval '30 days';
    ELSE
      v_date_filter := '1900-01-01'::timestamp with time zone;
  END CASE;

  RETURN QUERY
  WITH latest_scores AS (
    SELECT DISTINCT ON (es.user_id)
      es.user_id,
      es.temporal_score,
      es.percentile,
      es.level,
      es.level_tier,
      es.calculated_at
    FROM public.elite_scores es
    WHERE es.calculated_at >= v_date_filter
    ORDER BY es.user_id, es.calculated_at DESC
  ),
  user_badge_counts AS (
    SELECT
      ub.user_id,
      COUNT(*)::BIGINT as badge_count
    FROM public.user_badges ub
    GROUP BY ub.user_id
  ),
  ranked_users AS (
    SELECT
      ls.user_id,
      COALESCE(p.full_name, 'Anonymous') as full_name,
      p.avatar_url,
      ls.temporal_score,
      ls.percentile,
      ls.level,
      ls.level_tier,
      COALESCE(ubc.badge_count, 0) as badge_count,
      ROW_NUMBER() OVER (ORDER BY ls.temporal_score DESC, ls.calculated_at ASC) as rank
    FROM latest_scores ls
    LEFT JOIN public.profiles p ON p.id = ls.user_id
    LEFT JOIN user_badge_counts ubc ON ubc.user_id = ls.user_id
  )
  SELECT
    ru.user_id,
    ru.full_name,
    ru.avatar_url,
    ru.temporal_score,
    ru.percentile,
    ru.level,
    ru.level_tier,
    ru.badge_count,
    ru.rank
  FROM ranked_users ru
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION public.get_elite_leaderboard TO authenticated;

-- =====================================================
-- SEED DATA: Initial Badges
-- =====================================================

INSERT INTO public.elite_badges (name, description, icon, category, points, rarity, requirements) VALUES
  ('First Steps', 'Complete your first activity', '🏃', 'milestone', 10, 'common', '{"activities_count": 1}'),
  ('Consistency King', 'Train 7 days in a row', '👑', 'consistency', 50, 'rare', '{"consecutive_days": 7}'),
  ('Distance Warrior', 'Run 100km total', '🎯', 'achievement', 100, 'rare', '{"total_distance_km": 100}'),
  ('Speed Demon', 'Average pace under 5:00/km', '⚡', 'performance', 75, 'epic', '{"avg_pace_per_km_seconds": 300}'),
  ('Marathon Ready', 'Complete a marathon distance', '🏅', 'milestone', 200, 'epic', '{"single_distance_km": 42.195}'),
  ('Century Club', 'Complete 100 activities', '💯', 'achievement', 150, 'epic', '{"activities_count": 100}'),
  ('Elite Legend', 'Reach Elite Pro tier', '💎', 'special', 500, 'legendary', '{"level": "pro"}')
ON CONFLICT (name) DO NOTHING;