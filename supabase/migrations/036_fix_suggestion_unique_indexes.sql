-- Scope suggestion uniqueness per user so foreign analysisId squatting cannot block victims.

DROP INDEX IF EXISTS idx_article_suggestions_analysis_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_suggestions_user_analysis_unique
  ON article_suggestions(user_id, analysis_id);

DROP INDEX IF EXISTS idx_social_post_suggestions_analysis_platform;
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_post_suggestions_user_analysis_platform
  ON social_post_suggestions(user_id, analysis_id, platform);
