/**
 * Data Migration Script
 *
 * Migrates data from Lovable's Supabase to new independent Supabase instance.
 *
 * Usage:
 *   npx tsx scripts/migrate-data.ts
 *
 * Prerequisites:
 *   - Install tsx: npm install -g tsx
 *   - Set environment variables (see below)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Configuration
// =============================================================================

const config = {
  // OLD (Lovable) Supabase
  old: {
    url: process.env.OLD_SUPABASE_URL || '',
    serviceKey: process.env.OLD_SUPABASE_SERVICE_KEY || '',
  },
  // NEW (Independent) Supabase
  new: {
    url: process.env.VITE_SUPABASE_URL || '',
    serviceKey: process.env.NEW_SUPABASE_SERVICE_KEY || '',
  },
  // Options
  batchSize: 100,
  dryRun: process.env.DRY_RUN === 'true',
};

// Validate configuration
if (!config.old.url || !config.old.serviceKey) {
  console.error('❌ Missing OLD Supabase credentials');
  console.error('Set: OLD_SUPABASE_URL and OLD_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

if (!config.new.url || !config.new.serviceKey) {
  console.error('❌ Missing NEW Supabase credentials');
  console.error('Set: VITE_SUPABASE_URL and NEW_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// =============================================================================
// Initialize Supabase Clients
// =============================================================================

const oldSupabase = createClient(config.old.url, config.old.serviceKey);
const newSupabase = createClient(config.new.url, config.new.serviceKey);

// =============================================================================
// Utility Functions
// =============================================================================

async function fetchAllPages<T>(
  supabase: SupabaseClient,
  table: string,
  select: string = '*'
): Promise<T[]> {
  const allRecords: T[] = [];
  let offset = 0;
  const pageSize = config.batchSize;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Error fetching ${table}: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    allRecords.push(...(data as T[]));
    offset += pageSize;

    console.log(`  Fetched ${allRecords.length} records from ${table}...`);

    if (data.length < pageSize) break; // Last page
  }

  return allRecords;
}

async function insertBatch<T>(
  supabase: SupabaseClient,
  table: string,
  records: T[]
): Promise<void> {
  if (config.dryRun) {
    console.log(`  [DRY RUN] Would insert ${records.length} records into ${table}`);
    return;
  }

  const { error } = await supabase.from(table).upsert(records, {
    onConflict: 'id',
  });

  if (error) {
    throw new Error(`Error inserting into ${table}: ${error.message}`);
  }
}

// =============================================================================
// Migration Functions
// =============================================================================

async function migrateProfiles() {
  console.log('\n📊 Migrating Profiles...');
  console.log('─────────────────────────');

  try {
    const profiles = await fetchAllPages<any>(oldSupabase, 'profiles');
    console.log(`✅ Fetched ${profiles.length} profiles from old database`);

    // Insert in batches
    for (let i = 0; i < profiles.length; i += config.batchSize) {
      const batch = profiles.slice(i, i + config.batchSize);
      await insertBatch(newSupabase, 'profiles', batch);
      console.log(`  Inserted batch ${Math.floor(i / config.batchSize) + 1}`);
    }

    console.log(`✅ Migrated ${profiles.length} profiles`);
    return profiles.length;
  } catch (error) {
    console.error(`❌ Error migrating profiles:`, error);
    throw error;
  }
}

async function migrateActivities() {
  console.log('\n🏃 Migrating Activities...');
  console.log('─────────────────────────');

  try {
    const activities = await fetchAllPages<any>(oldSupabase, 'activities');
    console.log(`✅ Fetched ${activities.length} activities from old database`);

    // Insert in batches
    for (let i = 0; i < activities.length; i += config.batchSize) {
      const batch = activities.slice(i, i + config.batchSize);
      await insertBatch(newSupabase, 'activities', batch);
      console.log(`  Inserted batch ${Math.floor(i / config.batchSize) + 1}`);
    }

    console.log(`✅ Migrated ${activities.length} activities`);
    return activities.length;
  } catch (error) {
    console.error(`❌ Error migrating activities:`, error);
    throw error;
  }
}

async function migrateEliteScores() {
  console.log('\n🏆 Migrating Elite Scores...');
  console.log('─────────────────────────');

  try {
    // Check if table exists in old database
    const { data: scores, error } = await oldSupabase
      .from('elite_scores')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`⚠️  elite_scores table not found in old database (this is OK if new feature)`);
      return 0;
    }

    const allScores = await fetchAllPages<any>(oldSupabase, 'elite_scores');
    console.log(`✅ Fetched ${allScores.length} elite scores from old database`);

    // Insert in batches
    for (let i = 0; i < allScores.length; i += config.batchSize) {
      const batch = allScores.slice(i, i + config.batchSize);
      await insertBatch(newSupabase, 'elite_scores', batch);
      console.log(`  Inserted batch ${Math.floor(i / config.batchSize) + 1}`);
    }

    console.log(`✅ Migrated ${allScores.length} elite scores`);
    return allScores.length;
  } catch (error) {
    console.error(`❌ Error migrating elite scores:`, error);
    return 0;
  }
}

async function migrateUserBadges() {
  console.log('\n🎖️  Migrating User Badges...');
  console.log('─────────────────────────');

  try {
    // Check if table exists in old database
    const { data: badges, error } = await oldSupabase
      .from('user_badges')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`⚠️  user_badges table not found in old database (this is OK if new feature)`);
      return 0;
    }

    const allBadges = await fetchAllPages<any>(oldSupabase, 'user_badges');
    console.log(`✅ Fetched ${allBadges.length} user badges from old database`);

    // Insert in batches
    for (let i = 0; i < allBadges.length; i += config.batchSize) {
      const batch = allBadges.slice(i, i + config.batchSize);
      await insertBatch(newSupabase, 'user_badges', batch);
      console.log(`  Inserted batch ${Math.floor(i / config.batchSize) + 1}`);
    }

    console.log(`✅ Migrated ${allBadges.length} user badges`);
    return allBadges.length;
  } catch (error) {
    console.error(`❌ Error migrating user badges:`, error);
    return 0;
  }
}

// =============================================================================
// Verification Functions
// =============================================================================

async function verifyMigration() {
  console.log('\n🔍 Verifying Migration...');
  console.log('─────────────────────────');

  const tables = ['profiles', 'activities', 'elite_scores', 'user_badges'];

  for (const table of tables) {
    try {
      const { count: oldCount, error: oldError } = await oldSupabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      const { count: newCount, error: newError } = await newSupabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (oldError) {
        console.log(`  ⚠️  ${table}: Not found in old database`);
        continue;
      }

      if (newError) {
        console.log(`  ❌ ${table}: Error in new database - ${newError.message}`);
        continue;
      }

      if (oldCount === newCount) {
        console.log(`  ✅ ${table}: ${newCount} records (match)`);
      } else {
        console.log(
          `  ⚠️  ${table}: Old=${oldCount}, New=${newCount} (mismatch!)`
        );
      }
    } catch (error) {
      console.log(`  ❌ ${table}: Error during verification`);
    }
  }
}

// =============================================================================
// Main Migration Flow
// =============================================================================

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Supabase Data Migration Script      ║');
  console.log('╚════════════════════════════════════════╝');

  if (config.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No data will be written\n');
  }

  console.log('\nConfiguration:');
  console.log(`  Old Supabase: ${config.old.url}`);
  console.log(`  New Supabase: ${config.new.url}`);
  console.log(`  Batch Size: ${config.batchSize}`);
  console.log(`  Dry Run: ${config.dryRun}`);

  const stats = {
    profiles: 0,
    activities: 0,
    eliteScores: 0,
    userBadges: 0,
    startTime: Date.now(),
  };

  try {
    // Migrate tables in order (respecting foreign keys)
    stats.profiles = await migrateProfiles();
    stats.activities = await migrateActivities();
    stats.eliteScores = await migrateEliteScores();
    stats.userBadges = await migrateUserBadges();

    // Verify migration
    await verifyMigration();

    // Summary
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║        Migration Summary               ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`\n✅ Profiles:      ${stats.profiles}`);
    console.log(`✅ Activities:    ${stats.activities}`);
    console.log(`✅ Elite Scores:  ${stats.eliteScores}`);
    console.log(`✅ User Badges:   ${stats.userBadges}`);
    console.log(`\n⏱️  Duration: ${duration} seconds`);
    console.log('\n🎉 Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
main();
