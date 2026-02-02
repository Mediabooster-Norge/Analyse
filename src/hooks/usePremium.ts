'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface PremiumStatus {
  isPremium: boolean;
  monthlyAnalysisLimit: number;
  premiumExpiresAt: Date | null;
  loading: boolean;
}

// Premium emails for testing (before database is set up)
const PREMIUM_EMAILS = ['web@mediabooster.no'];

export function usePremium(): PremiumStatus {
  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    monthlyAnalysisLimit: 3,
    premiumExpiresAt: null,
    loading: true,
  });

  useEffect(() => {
    async function checkPremiumStatus() {
      const supabase = createClient();
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setStatus({
            isPremium: false,
            monthlyAnalysisLimit: 3,
            premiumExpiresAt: null,
            loading: false,
          });
          return;
        }

        // First check hardcoded premium emails (for testing)
        if (user.email && PREMIUM_EMAILS.includes(user.email)) {
          setStatus({
            isPremium: true,
            monthlyAnalysisLimit: 999,
            premiumExpiresAt: null,
            loading: false,
          });
          return;
        }

        // Try to get premium status from database
        const { data, error } = await supabase.rpc('get_user_premium_status');
        
        if (error) {
          // If function doesn't exist yet, fall back to email check
          console.warn('Premium status check failed, using fallback:', error.message);
          setStatus({
            isPremium: false,
            monthlyAnalysisLimit: 3,
            premiumExpiresAt: null,
            loading: false,
          });
          return;
        }

        if (data && data.length > 0) {
          const profile = data[0];
          setStatus({
            isPremium: profile.is_premium ?? false,
            monthlyAnalysisLimit: profile.monthly_analysis_limit ?? 3,
            premiumExpiresAt: profile.premium_expires_at ? new Date(profile.premium_expires_at) : null,
            loading: false,
          });
        } else {
          setStatus({
            isPremium: false,
            monthlyAnalysisLimit: 3,
            premiumExpiresAt: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setStatus({
          isPremium: false,
          monthlyAnalysisLimit: 3,
          premiumExpiresAt: null,
          loading: false,
        });
      }
    }

    checkPremiumStatus();
  }, []);

  return status;
}

// Helper function to check premium status without hook (for server-side or one-time checks)
export async function checkPremiumStatus(user: User | null): Promise<{
  isPremium: boolean;
  monthlyAnalysisLimit: number;
}> {
  if (!user) {
    return { isPremium: false, monthlyAnalysisLimit: 3 };
  }

  // Check hardcoded premium emails first
  if (user.email && PREMIUM_EMAILS.includes(user.email)) {
    return { isPremium: true, monthlyAnalysisLimit: 999 };
  }

  // Try database check
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc('get_user_premium_status');
    
    if (error || !data || data.length === 0) {
      return { isPremium: false, monthlyAnalysisLimit: 3 };
    }

    return {
      isPremium: data[0].is_premium ?? false,
      monthlyAnalysisLimit: data[0].monthly_analysis_limit ?? 3,
    };
  } catch {
    return { isPremium: false, monthlyAnalysisLimit: 3 };
  }
}

// Premium feature limits
export const PREMIUM_LIMITS = {
  free: {
    monthlyAnalyses: 3,
    competitors: 2,
    keywords: 10, // Max nøkkelord per analyse
    keywordUpdates: 2,
    competitorUpdates: 2,
    aiVisibilityChecks: 1,
  },
  premium: {
    monthlyAnalyses: 999, // Unlimited
    competitors: 5, // Reduced from 10 to stay within Vercel 60s timeout
    keywords: 50, // Max nøkkelord per analyse
    keywordUpdates: 999, // Unlimited
    competitorUpdates: 999, // Unlimited
    aiVisibilityChecks: 999, // Unlimited
  },
};

export function getPremiumLimits(isPremium: boolean) {
  return isPremium ? PREMIUM_LIMITS.premium : PREMIUM_LIMITS.free;
}
