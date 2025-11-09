# 🚀 Migration Quick Start Guide

**⏱️ Total Time: 2-4 hours** | **📚 Full Guide**: [MIGRATION_ROADMAP.md](./MIGRATION_ROADMAP.md)

---

## 🎯 Goal

Migrate from **Lovable's Supabase** → **Independent Supabase Project**

---

## ⚡ Quick Steps

### 1️⃣ Create Supabase Project (5 min)

1. Go to https://supabase.com → **New Project**
2. Save these values:
   - Project Ref: `____________`
   - Database Password: `____________`
   - Project URL: `https://____________.supabase.co`
   - Anon Key: `eyJ____________`

---

### 2️⃣ Automated Setup (10 min)

```bash
# Run automated setup script
./scripts/setup-new-supabase.sh

# Follow prompts to:
# - Link project
# - Apply migrations
# - Deploy Edge Functions
# - Configure .env.local
```

---

### 3️⃣ Configure Secrets (5 min)

Go to: https://app.supabase.com/project/[YOUR-REF]/settings/functions

Add these secrets:

| Secret | Where to Get |
|--------|--------------|
| `STRAVA_CLIENT_ID` | https://www.strava.com/settings/api |
| `STRAVA_CLIENT_SECRET` | https://www.strava.com/settings/api |
| `TRUTHSYNTAX_URL` | https://api.truthsyntax.com |
| `TRUTHSYNTAX_API_KEY` | Contact TruthSyntax |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |

---

### 4️⃣ Test Locally (5 min)

```bash
# Start dev server
npm run dev

# Open browser
# http://localhost:5173

# Test:
# ✅ Sign up / Login
# ✅ Connect Strava
# ✅ Add activity
# ✅ Calculate Elite Score
```

---

### 5️⃣ Deploy to Vercel (15 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard:
# https://vercel.com/[YOUR-ACCOUNT]/[PROJECT]/settings/environment-variables
```

**Required Vercel Environment Variables:**

```env
VITE_SUPABASE_URL=https://[your-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRAVA_CLIENT_ID=...
VITE_TRUTHSYNTAX_URL=https://api.truthsyntax.com
VITE_TRUTHSYNTAX_API_KEY=...
VITE_APP_URL=https://[your-app].vercel.app
```

---

### 6️⃣ Update OAuth Redirects (5 min)

#### Strava:
1. Go to: https://www.strava.com/settings/api
2. Add domain: `[your-app].vercel.app`

#### Supabase:
1. Go to: https://app.supabase.com/project/[YOUR-REF]/auth/url-configuration
2. Set Site URL: `https://[your-app].vercel.app`
3. Add Redirect URL: `https://[your-app].vercel.app/**`

---

### 7️⃣ Verify Migration (2 min)

```bash
# Run verification script
./scripts/verify-migration.sh

# Expected output:
# ✅ All checks passed!
```

---

## 🔧 Manual Commands (if script fails)

### Link Project
```bash
supabase login
supabase link --project-ref [YOUR-PROJECT-REF]
```

### Apply Migrations
```bash
supabase db push
```

### Deploy Edge Functions
```bash
supabase functions deploy calculate-elite-score
supabase functions deploy strava-auth
supabase functions deploy strava-callback
supabase functions deploy strava-sync
```

### Build Frontend
```bash
npm install
npm run build
```

---

## 📊 Data Migration (Optional)

**If you have existing users in Lovable's Supabase:**

1. Get Lovable's Supabase credentials:
   - Service Role Key
   - Project URL

2. Set environment variables:
```bash
export OLD_SUPABASE_URL="https://lovable-project.supabase.co"
export OLD_SUPABASE_SERVICE_KEY="eyJ..."
export NEW_SUPABASE_SERVICE_KEY="eyJ..."
```

3. Run migration:
```bash
npx tsx scripts/migrate-data.ts
```

4. Verify:
```bash
# Check record counts match
supabase db remote ls
```

---

## 🆘 Troubleshooting

### Can't connect to Supabase
```bash
# Re-authenticate
supabase logout
supabase login
supabase link --project-ref [YOUR-REF]
```

### Migrations fail
```bash
# Check migration files exist
ls -la supabase/migrations/

# Check database connection
supabase db remote ls

# Reset and retry
supabase db reset
supabase db push
```

### Edge Functions not working
```bash
# Check deployment status
supabase functions list

# View logs
supabase functions logs calculate-elite-score

# Redeploy
supabase functions deploy calculate-elite-score
```

### Build errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Strava OAuth not working
- Check redirect URIs match exactly
- Verify CLIENT_ID is correct in .env.local
- Check Edge Function secrets are set in Supabase Dashboard

---

## 📚 Resources

- **Full Migration Guide**: [MIGRATION_ROADMAP.md](./MIGRATION_ROADMAP.md)
- **Elite Score Docs**: [ELITE_SCORE_README.md](./ELITE_SCORE_README.md)
- **Commit Summary**: [COMMIT_SUMMARY.md](./COMMIT_SUMMARY.md)
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

## ✅ Final Checklist

Before launching to users:

- [ ] Supabase project created and linked
- [ ] Database migrations applied
- [ ] All Edge Functions deployed
- [ ] Edge Function secrets configured
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Strava OAuth redirects configured
- [ ] Supabase Auth Site URL configured
- [ ] Custom domain configured (optional)
- [ ] Local testing passed
- [ ] Production testing passed
- [ ] Verification script passed
- [ ] Data migrated (if applicable)
- [ ] Old Lovable connection disabled

---

## 🎉 Success Criteria

Your migration is complete when:

✅ Users can sign up / login
✅ Strava OAuth connection works
✅ Activities sync from Strava
✅ Elite Score calculates correctly
✅ Leaderboard displays rankings
✅ Badges award automatically
✅ No console errors in browser
✅ No errors in Supabase logs
✅ No errors in Vercel logs

---

## 📞 Support

- **Issues**: https://github.com/LumenSyntax/club-stride-link/issues
- **Supabase Discord**: https://discord.supabase.com
- **Vercel Discord**: https://vercel.com/discord

---

**Good luck! 🚀**
