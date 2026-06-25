import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FREE_MONTHLY_ANALYSIS_LIMIT,
  PLUS_MONTHLY_ANALYSIS_LIMIT,
  PREMIUM_MONTHLY_ANALYSIS_LIMIT,
  getTierLimits,
  getMonthlyAnalysisLimit,
  getAiVisibilityChecksLimit,
  getArticleGenerationsLimit,
  isPaidTier,
} from '../lib/constants/premium';

test('defines expected monthly limits per tier', () => {
  assert.equal(getTierLimits('free').monthlyAnalyses, 5);
  assert.equal(getTierLimits('plus').monthlyAnalyses, 30);
  assert.equal(getTierLimits('premium').monthlyAnalyses, 80);

  assert.equal(getTierLimits('free').aiVisibilityChecks, 0);
  assert.equal(getTierLimits('plus').aiVisibilityChecks, 10);
  assert.equal(getTierLimits('premium').aiVisibilityChecks, 40);

  assert.equal(getTierLimits('free').articleGenerationsPerMonth, 5);
  assert.equal(getTierLimits('plus').articleGenerationsPerMonth, 30);
  assert.equal(getTierLimits('premium').articleGenerationsPerMonth, 60);
});

test('treats plus and premium as paid tiers with same feature limits except quotas', () => {
  const plus = getTierLimits('plus');
  const premium = getTierLimits('premium');

  assert.equal(isPaidTier('free'), false);
  assert.equal(isPaidTier('plus'), true);
  assert.equal(isPaidTier('premium'), true);

  assert.equal(plus.competitors, premium.competitors);
  assert.equal(plus.keywords, premium.keywords);
  assert.ok(plus.monthlyAnalyses < premium.monthlyAnalyses);
});

test('resolves analysis limits from tier constants', () => {
  assert.equal(getMonthlyAnalysisLimit('free'), FREE_MONTHLY_ANALYSIS_LIMIT);
  assert.equal(getMonthlyAnalysisLimit('plus'), PLUS_MONTHLY_ANALYSIS_LIMIT);
  assert.equal(getMonthlyAnalysisLimit('premium'), PREMIUM_MONTHLY_ANALYSIS_LIMIT);
  assert.equal(getAiVisibilityChecksLimit('free'), 0);
  assert.equal(getArticleGenerationsLimit('plus'), 30);
  assert.equal(getArticleGenerationsLimit('premium'), 60);
});
