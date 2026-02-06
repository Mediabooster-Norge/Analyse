/**
 * Oppretter Mediabooster-testbrukere med premium i Supabase.
 * Krever: SUPABASE_URL (eller NEXT_PUBLIC_SUPABASE_URL) og SUPABASE_SERVICE_ROLE_KEY.
 * Laster .env.local automatisk hvis den finnes.
 *
 * Kjør: node scripts/create-premium-users.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Last .env.local fra prosjektrot
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  });
}

const EMAILS = [
  'daniel@mediabooster.no',
  'sylvia@mediabooster.no',
  'hector@mediabooster.no',
  'jonas@mediabooster.no',
  'julia@mediabooster.no',
];
const PASSWORD = 'Mediabooster123';

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('Mangler SUPABASE_URL (eller NEXT_PUBLIC_SUPABASE_URL) eller SUPABASE_SERVICE_ROLE_KEY.');
    console.error('Hent dem fra Supabase Dashboard → Project Settings → API (Project URL og service_role secret).');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Oppretter brukere og setter premium...\n');

  for (const email of EMAILS) {
    try {
      const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
      });

      if (error) {
        if (error.message && error.message.includes('already been registered')) {
          console.log(`  ${email} – finnes allerede, oppdaterer premium`);
        } else {
          console.error(`  ${email} – feil:`, error.message);
          continue;
        }
      } else {
        console.log(`  ${email} – opprettet`);
      }
    } catch (err) {
      console.error(`  ${email} – feil:`, err.message);
    }
  }

  // Sett premium for alle disse e-postene i user_profiles
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .update({ is_premium: true, monthly_analysis_limit: 999, updated_at: new Date().toISOString() })
    .in('email', EMAILS)
    .select('email');

  if (error) {
    console.error('\nKunne ikke oppdatere user_profiles:', error.message);
    process.exit(1);
  }

  console.log('\nPremium satt for:', profiles?.length ?? 0, 'brukere');
  profiles?.forEach((p) => console.log('  -', p.email));
  console.log('\nFerdig. Passord på alle:', PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
