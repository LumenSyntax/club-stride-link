# 🚀 Migration Roadmap: Lovable → Independent Supabase

**Date**: 2025-11-09
**Status**: Ready to Execute
**Estimated Time**: 6-8 hours
**Difficulty**: Intermediate

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Phase 1: Setup Supabase from Scratch](#phase-1-setup-supabase-from-scratch)
4. [Phase 2: Deploy Edge Functions](#phase-2-deploy-edge-functions)
5. [Phase 3: Frontend Configuration](#phase-3-frontend-configuration)
6. [Phase 4: CI/CD Setup](#phase-4-cicd-setup)
7. [Phase 5: Production Launch](#phase-5-production-launch)
8. [Phase 6: Data Migration (If Needed)](#phase-6-data-migration-if-needed)
9. [Rollback Plan](#rollback-plan)
10. [Post-Migration Checklist](#post-migration-checklist)

---

## Overview

### Why Migrate?

Lovable's platform limitations prevent:
- ❌ Setting Edge Function secrets (required for TruthSyntax/V.O2 integration)
- ❌ Full control over database configuration
- ❌ Custom deployment pipelines
- ❌ Direct Supabase CLI access

### What We're Building

A fully independent infrastructure with:
- ✅ Own Supabase project with full admin access
- ✅ Edge Function secrets for TruthSyntax and V.O2 API
- ✅ Custom CI/CD pipeline via GitHub Actions
- ✅ Complete control over database and auth
- ✅ Production-ready deployment on Vercel/Netlify

### Architecture After Migration

```
GitHub Repository (club-stride-link)
    ↓
    ├─→ Supabase Project (database, auth, edge functions, storage)
    ├─→ Vercel/Netlify (frontend hosting)
    └─→ GitHub Actions (CI/CD automation)
```

---

## Pre-Migration Checklist

Before starting migration, ensure you have:

- [ ] **Supabase Account** - Create at https://supabase.com
- [ ] **GitHub Repository Access** - Ensure you have push permissions
- [ ] **Node.js 18+** - Required for Supabase CLI
- [ ] **npm/pnpm** - Package manager installed
- [ ] **Vercel or Netlify Account** - For frontend deployment
- [ ] **API Keys Ready**:
  - [ ] Strava Client ID & Secret
  - [ ] TruthSyntax API Key (optional, can add later)
  - [ ] V.O2 API Key (future, optional)
- [ ] **Lovable Repository Disconnected** - Ensure Lovable no longer manages this repo
- [ ] **Backup Current .env** - Save your current environment variables

---

## Phase 1: Setup Supabase from Scratch

**Estimated Time**: 1-2 hours
**Complexity**: Easy

### Step 1.1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `elite-run-club` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Pricing Plan**: Start with **Free** (can upgrade later)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project provisioning
6. **Save these values** (found in Settings → API):
   - Project URL: `https://[project-ref].supabase.co`
   - Anon/Public Key: `eyJhbGc...`
   - Service Role Key: `eyJhbGc...` (keep secret!)
   - Project Ref: `[project-ref]`

### Step 1.2: Install Supabase CLI

```bash
# Install globally
npm install -g supabase

# Verify installation
supabase --version
# Should show: supabase 1.x.x
```

### Step 1.3: Link Project to Supabase

```bash
# Navigate to project root
cd /home/user/club-stride-link

# Login to Supabase CLI
supabase login
# This will open a browser window - authorize the CLI

# Link your local project to remote Supabase
supabase link --project-ref [your-project-ref]
# Enter your database password when prompted

# Verify link
supabase projects list
# You should see your project listed
```

### Step 1.4: Configure Environment Variables

Create `.env.local` file in project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
# =====================================================
# Supabase Configuration
# =====================================================
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]

# =====================================================
# Strava Integration
# =====================================================
VITE_STRAVA_CLIENT_ID=[your-strava-client-id]

# Edge Function Secrets (set in Supabase Dashboard)
STRAVA_CLIENT_ID=[your-strava-client-id]
STRAVA_CLIENT_SECRET=[your-strava-client-secret]

# =====================================================
# TruthSyntax Integration (Optional)
# =====================================================
VITE_TRUTHSYNTAX_URL=https://api.truthsyntax.com
VITE_TRUTHSYNTAX_API_KEY=[your-truthsyntax-key]

# Edge Function Secrets (set in Supabase Dashboard)
TRUTHSYNTAX_URL=https://api.truthsyntax.com
TRUTHSYNTAX_API_KEY=[your-truthsyntax-key]

# =====================================================
# V.O2 Integration (Future)
# =====================================================
VITE_VO2_API_URL=https://api.vdoto2.com
VITE_VO2_API_KEY=pending

# =====================================================
# Development
# =====================================================
NODE_ENV=development
VITE_APP_URL=http://localhost:5173
```

### Step 1.5: Apply Database Migrations

```bash
# Push existing migrations to your new Supabase project
supabase db push

# Expected output:
# Applying migration 20251109000001_elite_score_system.sql...
# Applying migration [any other migrations]...
# ✅ All migrations applied successfully
```

**Verify migrations applied**:

```bash
# Check if tables exist
supabase db diff

# Should show: No schema changes detected
```

Or check in Supabase Dashboard:
1. Go to https://app.supabase.com/project/[your-project-ref]/editor
2. Verify tables exist:
   - `profiles`
   - `activities`
   - `elite_scores`
   - `elite_score_signals`
   - `elite_badges`
   - `user_badges`
   - `elite_recommendations`
   - `truth_validation_logs`

### Step 1.6: Configure Edge Function Secrets

Edge Functions need secrets that **cannot** be in code. Set them via Supabase Dashboard:

1. Go to: https://app.supabase.com/project/[your-project-ref]/settings/functions
2. Click **"Add new secret"**
3. Add these secrets:

| Secret Name | Value | Required? |
|------------|-------|-----------|
| `STRAVA_CLIENT_ID` | Your Strava Client ID | Yes |
| `STRAVA_CLIENT_SECRET` | Your Strava Client Secret | Yes |
| `TRUTHSYNTAX_URL` | `https://api.truthsyntax.com` | Optional |
| `TRUTHSYNTAX_API_KEY` | Your TruthSyntax API Key | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Service Role Key | Yes |

**Important**: After adding secrets, Edge Functions need to be redeployed to pick them up.

### Step 1.7: Test Local Development Setup

```bash
# Install dependencies
npm install

# Start Supabase local development (optional, for offline development)
supabase start

# Start frontend dev server
npm run dev

# Open browser to http://localhost:5173
# Try signing up/logging in to verify Supabase connection
```

**Verify connection**:
- Open browser console
- Should see no Supabase connection errors
- Auth should work (sign up/login)
- Check Supabase Dashboard → Authentication → Users (should see your test user)

---

## Phase 2: Deploy Edge Functions

**Estimated Time**: 1 hour
**Complexity**: Easy-Medium

### Step 2.1: Identify Edge Functions to Deploy

Based on your codebase, you need to deploy:

1. **`calculate-elite-score`** - Main Elite Score calculation function
2. **`strava-auth`** - Strava OAuth initialization (if exists)
3. **`strava-callback`** - Strava OAuth callback handler (if exists)
4. **`strava-sync`** - Sync activities from Strava (if exists)

Let's check what functions exist:

```bash
ls -la supabase/functions/
```

### Step 2.2: Deploy Edge Functions

Deploy each function individually:

```bash
# Deploy calculate-elite-score
supabase functions deploy calculate-elite-score

# Deploy other functions (if they exist)
supabase functions deploy strava-auth
supabase functions deploy strava-callback
supabase functions deploy strava-sync

# Verify deployment
supabase functions list

# Expected output:
# calculate-elite-score  │ Deployed  │ [timestamp]
# strava-auth            │ Deployed  │ [timestamp]
# ...
```

### Step 2.3: Test Edge Functions

Test the calculate-elite-score function:

```bash
# Get your auth token first
# Login to your app, then in browser console run:
# supabase.auth.getSession().then(d => console.log(d.data.session.access_token))

# Test function with curl
curl -X POST https://[your-project-ref].supabase.co/functions/v1/calculate-elite-score \
  -H "Authorization: Bearer [your-access-token]" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "score": {...},
#   "signals": [...],
#   "badges": [...],
#   "recommendations": [...]
# }
```

**Or test via frontend**:
1. Navigate to http://localhost:5173/elite-score
2. Click "CALCULATE MY SCORE"
3. Check browser console for any errors
4. Check Supabase Dashboard → Edge Functions → Logs for function execution logs

### Step 2.4: Monitor Edge Function Logs

```bash
# Stream logs in real-time
supabase functions logs calculate-elite-score

# Or check in Supabase Dashboard:
# https://app.supabase.com/project/[your-project-ref]/logs/edge-functions
```

### Step 2.5: Set CORS Headers (If Needed)

If you encounter CORS errors, ensure your Edge Functions return proper headers:

```typescript
// In your Edge Function handler
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  },
});
```

---

## Phase 3: Frontend Configuration

**Estimated Time**: 2 hours
**Complexity**: Medium

### Step 3.1: Update Environment Variables

Ensure `.env.local` is correctly configured (from Phase 1.4).

**Add these to `.gitignore`** (if not already there):

```bash
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
```

### Step 3.2: Build Production Bundle

```bash
# Build for production
npm run build

# Verify build output
ls -la dist/

# Test production build locally
npm run preview

# Open http://localhost:4173 and test functionality
```

### Step 3.3: Choose Deployment Platform

**Option A: Vercel (Recommended)**

Pros:
- ✅ Zero-config for Vite/React
- ✅ Automatic deployments on git push
- ✅ Edge Network (fast global CDN)
- ✅ Free SSL certificates
- ✅ Environment variable management

**Option B: Netlify**

Pros:
- ✅ Similar to Vercel, great for SPAs
- ✅ Forms and serverless functions built-in
- ✅ Free tier generous

**Option C: Cloudflare Pages**

Pros:
- ✅ Excellent performance
- ✅ Free tier with unlimited bandwidth

### Step 3.4: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# ? Set up and deploy "~/club-stride-link"? [Y/n] Y
# ? Which scope? [your-account]
# ? Link to existing project? [y/N] N
# ? What's your project's name? elite-run-club
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] N

# After deployment, you'll get:
# ✅ Production: https://elite-run-club.vercel.app
```

### Step 3.5: Configure Environment Variables in Vercel

1. Go to https://vercel.com/[your-account]/elite-run-club/settings/environment-variables
2. Add all variables from `.env.local`:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://[project-ref].supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `[your-anon-key]` | Production, Preview, Development |
| `VITE_STRAVA_CLIENT_ID` | `[your-strava-client-id]` | Production, Preview, Development |
| `VITE_TRUTHSYNTAX_URL` | `https://api.truthsyntax.com` | Production |
| `VITE_TRUTHSYNTAX_API_KEY` | `[your-key]` | Production |
| `VITE_APP_URL` | `https://elite-run-club.vercel.app` | Production |

3. Redeploy to apply environment variables:

```bash
vercel --prod
```

### Step 3.6: Update Strava OAuth Redirect URIs

1. Go to https://www.strava.com/settings/api
2. Update **Authorization Callback Domain**:
   - Add: `elite-run-club.vercel.app`
   - Add: `localhost:5173` (for local dev)
3. Update redirect URIs in your code if hardcoded

### Step 3.7: Configure Supabase Auth Site URL

1. Go to: https://app.supabase.com/project/[your-project-ref]/auth/url-configuration
2. Set **Site URL**: `https://elite-run-club.vercel.app`
3. Add **Redirect URLs**:
   - `https://elite-run-club.vercel.app/**`
   - `http://localhost:5173/**` (for local dev)

### Step 3.8: Test Production Deployment

1. Visit: https://elite-run-club.vercel.app
2. Test user flows:
   - [ ] Sign up / Login
   - [ ] Strava OAuth connection
   - [ ] Add/sync activities
   - [ ] Calculate Elite Score
   - [ ] View leaderboard
   - [ ] Check badges
3. Check browser console for errors
4. Check Vercel logs: https://vercel.com/[your-account]/elite-run-club/logs

---

## Phase 4: CI/CD Setup

**Estimated Time**: 1 hour
**Complexity**: Medium

### Step 4.1: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Supabase & Vercel

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

  deploy-supabase:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy database migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

      - name: Deploy Edge Functions
        run: |
          supabase functions deploy calculate-elite-score
          # Add other functions as needed
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-vercel:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Step 4.2: Configure GitHub Secrets

1. Go to: https://github.com/LumenSyntax/club-stride-link/settings/secrets/actions
2. Click **"New repository secret"**
3. Add these secrets:

| Secret Name | How to Get Value |
|------------|------------------|
| `SUPABASE_PROJECT_ID` | Your project ref (from Supabase Dashboard) |
| `SUPABASE_ACCESS_TOKEN` | Generate at https://app.supabase.com/account/tokens |
| `SUPABASE_DB_PASSWORD` | Database password you set when creating project |
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VERCEL_TOKEN` | Generate at https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Found in Vercel project settings |
| `VERCEL_PROJECT_ID` | Found in Vercel project settings |

### Step 4.3: Add Type Check Script

Add to `package.json`:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

### Step 4.4: Test CI/CD Pipeline

```bash
# Create a test commit
git add .
git commit -m "test: CI/CD pipeline setup"
git push origin main

# Watch GitHub Actions run:
# https://github.com/LumenSyntax/club-stride-link/actions
```

### Step 4.5: Set Up Branch Protection (Optional)

1. Go to: https://github.com/LumenSyntax/club-stride-link/settings/branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
     - Select: `test`, `deploy-supabase`, `deploy-vercel`
   - ✅ Require branches to be up to date before merging

---

## Phase 5: Production Launch

**Estimated Time**: 1-2 hours
**Complexity**: Easy

### Step 5.1: Custom Domain Setup (Optional)

**If you have a custom domain (e.g., eliterunclub.fit)**:

#### Configure Vercel:

1. Go to: https://vercel.com/[your-account]/elite-run-club/settings/domains
2. Click **"Add"**
3. Enter your domain: `eliterunclub.fit`
4. Add DNS records (provided by Vercel):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

#### Update Environment Variables:

```env
VITE_APP_URL=https://eliterunclub.fit
```

#### Update Supabase Auth:

1. Go to: https://app.supabase.com/project/[your-project-ref]/auth/url-configuration
2. Set **Site URL**: `https://eliterunclub.fit`
3. Add redirect URL: `https://eliterunclub.fit/**`

#### Update Strava OAuth:

1. Go to: https://www.strava.com/settings/api
2. Update **Authorization Callback Domain**: `eliterunclub.fit`

### Step 5.2: Enable Supabase Production Mode

1. Go to: https://app.supabase.com/project/[your-project-ref]/settings/general
2. Review **Project Settings**:
   - ✅ Enable RLS on all tables
   - ✅ Enable email confirmations (if needed)
   - ✅ Configure SMTP for email (optional)
3. Check **Database Settings**:
   - ✅ Connection pooling enabled
   - ✅ Appropriate compute resources (upgrade if needed)

### Step 5.3: Performance Optimization

#### Enable Vercel Edge Network:

Already enabled by default on Vercel ✅

#### Configure Caching Headers:

Create `vercel.json` in project root:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).(?:jpg|jpeg|png|gif|svg|ico|webp)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=2592000, immutable"
        }
      ]
    }
  ]
}
```

#### Enable Gzip Compression:

Already enabled by Vercel ✅

### Step 5.4: Security Hardening

#### Enable HTTPS-only:

Already enforced by Vercel ✅

#### Configure Content Security Policy:

Add to `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co https://api.truthsyntax.com https://www.strava.com;
  frame-src 'none';
">
```

#### Review Supabase RLS Policies:

```bash
# Check RLS is enabled on all tables
supabase db remote ls

# Review policies in Supabase Dashboard:
# https://app.supabase.com/project/[your-project-ref]/auth/policies
```

### Step 5.5: Set Up Monitoring

#### Vercel Analytics:

1. Go to: https://vercel.com/[your-account]/elite-run-club/analytics
2. Enable **Web Analytics** (free)
3. Enable **Speed Insights** (free)

#### Supabase Monitoring:

1. Go to: https://app.supabase.com/project/[your-project-ref]/reports
2. Review:
   - **API Requests** - Track usage
   - **Database Performance** - Monitor query performance
   - **Edge Functions** - Monitor invocations and errors

#### Error Tracking (Optional):

Consider adding Sentry:

```bash
npm install @sentry/react @sentry/vite-plugin
```

Configure in `main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
});
```

### Step 5.6: Create Runbook

Document common operations in `RUNBOOK.md`:

```markdown
# Production Runbook

## Deploy New Version
```bash
git push origin main
# CI/CD will auto-deploy
```

## Rollback Deployment
```bash
vercel rollback
```

## Check Edge Function Logs
```bash
supabase functions logs calculate-elite-score
```

## Database Backup
```bash
# Automatic daily backups in Supabase Dashboard
# Manual backup:
supabase db dump -f backup.sql
```

## Emergency Contacts
- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/support
```

### Step 5.7: Final Production Checks

- [ ] All environment variables set correctly
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (verify with https://)
- [ ] Strava OAuth working in production
- [ ] Elite Score calculation working
- [ ] Leaderboard displaying correctly
- [ ] Database RLS policies active
- [ ] Edge Function secrets configured
- [ ] Monitoring enabled
- [ ] Error tracking configured (if using Sentry)
- [ ] CI/CD pipeline passing
- [ ] Backup strategy in place

---

## Phase 6: Data Migration (If Needed)

**Estimated Time**: 2-3 hours (depends on data volume)
**Complexity**: Medium-High
**Skip if**: Starting fresh with no existing users

### Step 6.1: Export Data from Lovable Supabase

If you have existing users and data in Lovable's Supabase:

```bash
# You'll need Lovable's Supabase credentials
# (This might be difficult if Lovable doesn't provide direct access)

# Export users
supabase db dump --db-url "postgresql://[lovable-db-url]" -f lovable-backup.sql

# Or use Supabase Studio to export as CSV:
# 1. Go to Lovable's Supabase Studio
# 2. Select each table
# 3. Export → CSV
```

### Step 6.2: Transform Data

Create migration script `scripts/migrate-data.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = 'https://lovable-project.supabase.co';
const OLD_SUPABASE_KEY = 'old-service-role-key';

const NEW_SUPABASE_URL = 'https://your-new-project.supabase.co';
const NEW_SUPABASE_KEY = 'new-service-role-key';

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

async function migrateUsers() {
  // Fetch users from old DB
  const { data: users } = await oldSupabase.from('profiles').select('*');

  // Insert into new DB
  for (const user of users) {
    await newSupabase.from('profiles').upsert(user);
  }

  console.log(`Migrated ${users.length} users`);
}

async function migrateActivities() {
  // Similar process for activities
  const { data: activities } = await oldSupabase.from('activities').select('*');

  for (const activity of activities) {
    await newSupabase.from('activities').upsert(activity);
  }

  console.log(`Migrated ${activities.length} activities`);
}

async function main() {
  await migrateUsers();
  await migrateActivities();
  // Add more tables as needed
}

main().catch(console.error);
```

Run migration:

```bash
npx tsx scripts/migrate-data.ts
```

### Step 6.3: Verify Data Migration

```sql
-- Check record counts match
SELECT
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM activities) as activities_count,
  (SELECT COUNT(*) FROM elite_scores) as elite_scores_count;
```

### Step 6.4: Notify Users (If Applicable)

If you have existing users, notify them of:
- New authentication flow (if changed)
- Need to reconnect Strava (OAuth tokens don't transfer)
- Any data that didn't migrate

---

## Rollback Plan

### If Something Goes Wrong

#### Revert to Lovable (Emergency Only)

1. **Reconnect repository to Lovable**:
   - Go to Lovable dashboard
   - Reconnect GitHub repository

2. **Revert environment variables**:
   ```bash
   # Use old Lovable Supabase credentials
   VITE_SUPABASE_URL=https://lovable-project.supabase.co
   VITE_SUPABASE_ANON_KEY=old-anon-key
   ```

3. **Redeploy via Lovable**

#### Rollback Vercel Deployment

```bash
# View recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

#### Rollback Database Migration

```bash
# If you have a backup
supabase db reset

# Or manually revert migration
supabase migration down [migration-timestamp]
```

---

## Post-Migration Checklist

After completing migration, verify:

### Infrastructure
- [ ] Supabase project operational
- [ ] All tables migrated successfully
- [ ] RLS policies active and tested
- [ ] Edge Functions deployed and working
- [ ] Environment variables configured correctly

### Application
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Authentication working (signup/login)
- [ ] Strava OAuth functional
- [ ] Elite Score calculation working
- [ ] Leaderboard displaying correctly
- [ ] All pages loading correctly

### CI/CD
- [ ] GitHub Actions workflow passing
- [ ] Automatic deployments working
- [ ] Database migrations auto-apply
- [ ] Edge Functions auto-deploy

### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Supabase monitoring active
- [ ] Error tracking configured (if using Sentry)
- [ ] Logs accessible and readable

### Documentation
- [ ] README updated with new setup instructions
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Runbook created

### Communication
- [ ] Team notified of new infrastructure
- [ ] Users notified (if applicable)
- [ ] Lovable disconnected
- [ ] Old credentials revoked

---

## Cost Estimates

### Supabase Free Tier
- ✅ 500 MB database storage
- ✅ 1 GB file storage
- ✅ 50,000 monthly active users
- ✅ 500,000 Edge Function invocations/month
- ✅ Unlimited API requests

**Expected Cost**: $0/month (until you exceed free tier)

### Vercel Free Tier
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic SSL
- ✅ Analytics included

**Expected Cost**: $0/month (for hobby projects)

### Total Monthly Cost
- **Phase 1 (MVP)**: $0/month
- **Phase 2 (Growing)**: $25/month (Supabase Pro)
- **Phase 3 (Scale)**: $75/month (Supabase Pro + Vercel Pro)

---

## Need Help?

### Resources
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions

### Support Channels
- **Supabase Discord**: https://discord.supabase.com
- **Vercel Discord**: https://vercel.com/discord
- **GitHub Issues**: For this project

---

## Next Steps After Migration

Once migration is complete, focus on:

1. **TruthSyntax Integration** - Configure API key and test EVC validation
2. **V.O2 API Integration** - Implement VDOT-based scoring
3. **Performance Optimization** - Add Redis caching, optimize queries
4. **Feature Development** - Build new features leveraging full Supabase access
5. **Testing** - Add unit tests, integration tests, E2E tests

---

**Good luck with your migration! 🚀**

**Remember**: Take it one phase at a time. Test thoroughly after each phase before moving to the next.
