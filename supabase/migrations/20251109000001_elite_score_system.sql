-- =====================================================
-- Elite Score System Migration
-- Version: 1.0.0
-- Date: 2025-11-09
-- Description: Implements the Elite Score system with TruthSyntax validation
-- =====================================================

-- First, enhance the activities table with additional metrics needed for Elite Score
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS average_pace INTEGER, -- seconds per km
ADD COLUMN IF NOT EXISTS elevation_gain INTEGER, -- meters
ADD COLUMN IF NOT EXISTS heart_rate_avg INTEGER, -- bpm
ADD COLUMN IF NOT EXISTS heart_rate_max INTEGER, -- bpm
ADD COLUMN IF NOT EXISTS strava_activity_id BIGINT UNIQUE, -- Strava integration
ADD COLUMN IF NOT EXISTS weather_conditions JSONB, -- weather data
ADD COLUMN IF NOT EXISTS device_data JSONB, -- device/watch data
ADD COLUMN IF NOT EXISTS gpx_data TEXT; -- GPS tracking data

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_activities_strava_id ON public.activities(strava_activity_id);

-- =====================================================
-- Elite Scores Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.elite_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instant_score DECIMAL(5,4) NOT NULL CHECK (instant_score >= 0 AND instant_score <= 1),
    temporal_score DECIMAL(5,4) NOT NULL CHECK (temporal_score >= 0 AND temporal_score <= 1),
    percentile INTEGER CHECK (percentile >= 0 AND percentile <= 100),
    level VARCHAR(20) NOT NULL,
    level_tier VARCHAR(50) NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    next_evaluation TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.elite_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for elite_scores
CREATE POLICY "Users can view own elite scores"
    ON public.elite_scores FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view all elite scores for leaderboard"
    ON public.elite_scores FOR SELECT
    USING (true); -- Public leaderboard visibility

-- =====================================================
-- Elite Score Signals Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.elite_score_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    score_id UUID NOT NULL REFERENCES public.elite_scores(id) ON DELETE CASCADE,
    signal_name VARCHAR(50) NOT NULL,
    signal_value DECIMAL(5,4) NOT NULL CHECK (signal_value >= 0 AND signal_value <= 1),
    weight DECIMAL(5,4) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    evidence JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.elite_score_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for signals
CREATE POLICY "Users can view own signals"
    ON public.elite_score_signals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.elite_scores
            WHERE elite_scores.id = elite_score_signals.score_id
            AND elite_scores.user_id = auth.uid()
        )
    );

-- =====================================================
-- Elite Badges Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.elite_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50),
    points INTEGER DEFAULT 0,
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    requirements JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS (badges are public)
ALTER TABLE public.elite_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
    ON public.elite_badges FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage badges"
    ON public.elite_badges FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- User Badges Junction Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.elite_badges(id) ON DELETE CASCADE,
    score_id UUID REFERENCES public.elite_scores(id),
    earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    evidence JSONB,
    UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
    ON public.user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view all user badges for public profiles"
    ON public.user_badges FOR SELECT
    USING (true); -- Public visibility for achievements

-- =====================================================
-- Elite Recommendations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.elite_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    score_id UUID NOT NULL REFERENCES public.elite_scores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    action_items JSONB,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.elite_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
    ON public.elite_recommendations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
    ON public.elite_recommendations FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- Truth Validation Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.truth_validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    validation_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    validation_result JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    anomalies_detected JSONB,
    validated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.truth_validation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own validation logs"
    ON public.truth_validation_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all validation logs"
    ON public.truth_validation_logs FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_elite_scores_user_id ON public.elite_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_elite_scores_calculated_at ON public.elite_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_elite_scores_temporal_score ON public.elite_scores(temporal_score DESC);
CREATE INDEX IF NOT EXISTS idx_elite_scores_user_latest ON public.elite_scores(user_id, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_elite_score_signals_score_id ON public.elite_score_signals(score_id);
CREATE INDEX IF NOT EXISTS idx_elite_score_signals_name ON public.elite_score_signals(signal_name);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_elite_recommendations_user_id ON public.elite_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_elite_recommendations_completed ON public.elite_recommendations(completed, expires_at);

CREATE INDEX IF NOT EXISTS idx_truth_validation_logs_user_id ON public.truth_validation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_truth_validation_logs_validated_at ON public.truth_validation_logs(validated_at DESC);

-- =====================================================
-- Updated At Triggers
-- =====================================================
CREATE TRIGGER update_elite_scores_updated_at
    BEFORE UPDATE ON public.elite_scores
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Functions for Elite Score System
-- =====================================================

-- Function to get latest elite score for a user
CREATE OR REPLACE FUNCTION public.get_latest_elite_score(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    instant_score DECIMAL,
    temporal_score DECIMAL,
    percentile INTEGER,
    level VARCHAR,
    level_tier VARCHAR,
    calculated_at TIMESTAMPTZ,
    signals JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        es.id,
        es.instant_score,
        es.temporal_score,
        es.percentile,
        es.level,
        es.level_tier,
        es.calculated_at,
        jsonb_agg(
            jsonb_build_object(
                'name', ess.signal_name,
                'value', ess.signal_value,
                'weight', ess.weight,
                'confidence', ess.confidence,
                'evidence', ess.evidence
            )
        ) as signals
    FROM public.elite_scores es
    LEFT JOIN public.elite_score_signals ess ON es.id = ess.score_id
    WHERE es.user_id = p_user_id
    GROUP BY es.id, es.instant_score, es.temporal_score, es.percentile, es.level, es.level_tier, es.calculated_at
    ORDER BY es.calculated_at DESC
    LIMIT 1;
END;
$$;

-- Function to get elite leaderboard
CREATE OR REPLACE FUNCTION public.get_elite_leaderboard(
    p_timeframe TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    temporal_score DECIMAL,
    percentile INTEGER,
    level VARCHAR,
    level_tier VARCHAR,
    badge_count BIGINT,
    rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
        WHERE
            CASE
                WHEN p_timeframe = 'day' THEN es.calculated_at > NOW() - INTERVAL '1 day'
                WHEN p_timeframe = 'week' THEN es.calculated_at > NOW() - INTERVAL '1 week'
                WHEN p_timeframe = 'month' THEN es.calculated_at > NOW() - INTERVAL '1 month'
                ELSE true
            END
        ORDER BY es.user_id, es.calculated_at DESC
    ),
    badge_counts AS (
        SELECT
            ub.user_id,
            COUNT(DISTINCT ub.badge_id) as badge_count
        FROM public.user_badges ub
        GROUP BY ub.user_id
    ),
    ranked_scores AS (
        SELECT
            ls.user_id,
            p.full_name,
            p.avatar_url,
            ls.temporal_score,
            ls.percentile,
            ls.level,
            ls.level_tier,
            COALESCE(bc.badge_count, 0) as badge_count,
            ROW_NUMBER() OVER (ORDER BY ls.temporal_score DESC, ls.calculated_at ASC) as rank
        FROM latest_scores ls
        LEFT JOIN public.profiles p ON ls.user_id = p.id
        LEFT JOIN badge_counts bc ON ls.user_id = bc.user_id
    )
    SELECT * FROM ranked_scores
    ORDER BY rank
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to calculate percentile for a score
CREATE OR REPLACE FUNCTION public.calculate_elite_percentile(p_score DECIMAL)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_percentile INTEGER;
    v_total_count INTEGER;
    v_below_count INTEGER;
BEGIN
    -- Get total count of latest scores
    SELECT COUNT(DISTINCT user_id) INTO v_total_count
    FROM (
        SELECT DISTINCT ON (user_id) user_id, temporal_score
        FROM public.elite_scores
        ORDER BY user_id, calculated_at DESC
    ) latest;

    -- Get count of scores below this score
    SELECT COUNT(*) INTO v_below_count
    FROM (
        SELECT DISTINCT ON (user_id) user_id, temporal_score
        FROM public.elite_scores
        ORDER BY user_id, calculated_at DESC
    ) latest
    WHERE temporal_score < p_score;

    -- Calculate percentile (what percentage of users this score beats)
    IF v_total_count > 0 THEN
        v_percentile := ROUND(((v_total_count - v_below_count)::DECIMAL / v_total_count::DECIMAL) * 100);
    ELSE
        v_percentile := 100;
    END IF;

    RETURN v_percentile;
END;
$$;

-- =====================================================
-- Seed Initial Badges
-- =====================================================
INSERT INTO public.elite_badges (name, description, icon, category, points, rarity, requirements) VALUES
('First Run', 'Complete your first tracked run', '🏃', 'milestone', 10, 'common', '{"activities_count": 1, "activity_type": "running"}'),
('Week Warrior', 'Complete 7 days of training in a row', '🔥', 'consistency', 50, 'rare', '{"consecutive_days": 7}'),
('Century Club', 'Run 100 total kilometers', '💯', 'distance', 100, 'epic', '{"total_distance_km": 100}'),
('Speed Demon', 'Achieve sub-4:00 min/km average pace', '⚡', 'performance', 75, 'rare', '{"average_pace_max": 240}'),
('Elite Foundation', 'Reach Foundation tier', '🥉', 'tier', 25, 'common', '{"elite_tier": "FOUNDATION"}'),
('Elite Emerging', 'Reach Emerging tier', '🥈', 'tier', 50, 'rare', '{"elite_tier": "EMERGING"}'),
('Elite Advanced', 'Reach Advanced tier', '🥇', 'tier', 100, 'epic', '{"elite_tier": "ADVANCED"}'),
('Elite Professional', 'Reach Professional tier', '💎', 'tier', 200, 'legendary', '{"elite_tier": "PROFESSIONAL"}'),
('Marathon Master', 'Complete a marathon distance', '🏅', 'achievement', 150, 'epic', '{"single_activity_distance_km": 42.195}'),
('Consistency King', 'Maintain 90%+ workout completion rate for 30 days', '👑', 'consistency', 125, 'epic', '{"completion_rate": 0.9, "days": 30}'),
('Data Integrity Pro', 'Maintain 100% data integrity score for 30 days', '🛡️', 'quality', 100, 'rare', '{"data_integrity": 1.0, "days": 30}'),
('Progress Pioneer', 'Improve your pace by 10% in 30 days', '📈', 'improvement', 80, 'rare', '{"pace_improvement": 0.1, "days": 30}')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Comments for Documentation
-- =====================================================
COMMENT ON TABLE public.elite_scores IS 'Stores calculated Elite Scores for users with temporal smoothing';
COMMENT ON TABLE public.elite_score_signals IS 'Individual signals that compose the Elite Score (performance, consistency, etc.)';
COMMENT ON TABLE public.elite_badges IS 'Achievement badges that users can earn';
COMMENT ON TABLE public.user_badges IS 'Junction table tracking which badges users have earned';
COMMENT ON TABLE public.elite_recommendations IS 'Personalized training recommendations based on Elite Score analysis';
COMMENT ON TABLE public.truth_validation_logs IS 'Logs of TruthSyntax validation checks for data integrity';

COMMENT ON FUNCTION public.get_latest_elite_score IS 'Retrieves the most recent Elite Score for a user with all signals';
COMMENT ON FUNCTION public.get_elite_leaderboard IS 'Generates leaderboard rankings based on temporal scores';
COMMENT ON FUNCTION public.calculate_elite_percentile IS 'Calculates what percentile a given score represents';
