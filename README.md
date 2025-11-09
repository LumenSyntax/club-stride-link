# 🏃 Elite Run Club

**A data-driven running club platform with Elite Score system, Strava integration, and TruthSyntax validation.**

---

## 🎯 Overview

Elite Run Club is a modern web application for running clubs that tracks athlete performance through a sophisticated multi-dimensional scoring system. The platform integrates with Strava for activity sync and uses TruthSyntax for data validation.

### Key Features

- ✅ **Elite Score System** - Multi-dimensional athlete scoring (Performance, Consistency, Data Integrity, Progression, Engagement)
- ✅ **Strava Integration** - Automatic activity sync via OAuth
- ✅ **Leaderboard** - Real-time rankings with multiple timeframes
- ✅ **Badge System** - 12+ achievements with automatic awarding
- ✅ **TruthSyntax Validation** - Evidence-validated confidence scoring
- ✅ **Personalized Recommendations** - AI-driven training insights

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Strava API credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/LumenSyntax/club-stride-link.git
cd club-stride-link

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

Visit http://localhost:5173

---

## 📦 Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite 7.2.2** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching & caching
- **Recharts** - Data visualization

### Backend
- **Supabase** - PostgreSQL database, Auth, Edge Functions, Storage
- **Deno** - Edge Function runtime
- **Row Level Security (RLS)** - Database-level security

### Integrations
- **Strava API** - Activity sync
- **TruthSyntax** - Data validation (optional)
- **V.O2 API** - Future VDOT integration (planned)

---

## 🔧 Setup & Deployment

### For New Installations

Follow the automated setup:

```bash
# Run setup script
./scripts/setup-new-supabase.sh
```

Or see detailed instructions in [MIGRATION_QUICKSTART.md](./MIGRATION_QUICKSTART.md)

### Migrating from Lovable

If you're migrating from Lovable's managed Supabase:

1. **Quick Start**: [MIGRATION_QUICKSTART.md](./MIGRATION_QUICKSTART.md) - 2-4 hours
2. **Full Guide**: [MIGRATION_ROADMAP.md](./MIGRATION_ROADMAP.md) - Complete step-by-step

### Manual Setup

1. **Create Supabase Project**: https://supabase.com
2. **Link Project**: `supabase link --project-ref [YOUR-REF]`
3. **Apply Migrations**: `supabase db push`
4. **Deploy Edge Functions**: `supabase functions deploy calculate-elite-score`
5. **Configure Secrets**: Set in Supabase Dashboard → Settings → Functions
6. **Deploy Frontend**: `vercel --prod` or `netlify deploy --prod`

---

## 📚 Documentation

- **[ELITE_SCORE_README.md](./ELITE_SCORE_README.md)** - Elite Score system documentation
- **[MIGRATION_ROADMAP.md](./MIGRATION_ROADMAP.md)** - Complete migration guide
- **[MIGRATION_QUICKSTART.md](./MIGRATION_QUICKSTART.md)** - Quick migration steps
- **[COMMIT_SUMMARY.md](./COMMIT_SUMMARY.md)** - Implementation summary
- **[.env.example](./.env.example)** - Environment variables template

---

## 🗂️ Project Structure

```
club-stride-link/
├── src/
│   ├── components/        # React components
│   │   ├── EliteLeaderboard.tsx
│   │   ├── Navigation.tsx
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Page components
│   │   ├── EliteScore.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   └── useEliteScore.tsx
│   ├── lib/              # Utilities
│   └── main.tsx          # App entry point
├── supabase/
│   ├── migrations/       # Database migrations
│   │   └── 20251109000001_elite_score_system.sql
│   └── functions/        # Edge Functions
│       ├── calculate-elite-score/
│       ├── strava-auth/
│       ├── strava-callback/
│       └── strava-sync/
├── scripts/              # Automation scripts
│   ├── setup-new-supabase.sh
│   ├── verify-migration.sh
│   └── migrate-data.ts
└── docs/                 # Documentation
```

---

## 🧪 Testing

### Verify Setup

```bash
./scripts/verify-migration.sh
```

### Manual Testing Checklist

- [ ] Sign up / Login works
- [ ] Strava OAuth connection
- [ ] Activity sync from Strava
- [ ] Elite Score calculation
- [ ] Leaderboard displays rankings
- [ ] Badges award correctly
- [ ] Recommendations generate

### Run Linter

```bash
npm run lint
```

### Type Check

```bash
npm run type-check
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Environment Variables

Set in deployment platform:

```env
VITE_SUPABASE_URL=https://[your-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRAVA_CLIENT_ID=...
VITE_TRUTHSYNTAX_URL=https://api.truthsyntax.com
VITE_TRUTHSYNTAX_API_KEY=...
VITE_APP_URL=https://your-domain.com
```

---

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Edge Function secrets stored securely in Supabase
- Environment variables never committed to git
- OAuth tokens encrypted at rest
- HTTPS-only in production

---

## 📊 Database Schema

### Core Tables

- `profiles` - User profiles
- `activities` - Running activities
- `elite_scores` - Calculated scores
- `elite_score_signals` - Score components
- `elite_badges` - Badge catalog
- `user_badges` - User achievements
- `elite_recommendations` - Personalized recommendations
- `truth_validation_logs` - TruthSyntax validation logs

See [ELITE_SCORE_README.md](./ELITE_SCORE_README.md) for detailed schema.

---

## 🔄 CI/CD

GitHub Actions workflow automatically:

1. Runs linter and type checks
2. Builds frontend
3. Deploys database migrations
4. Deploys Edge Functions
5. Deploys to Vercel

See `.github/workflows/deploy.yml`

---

## 🐛 Troubleshooting

### Common Issues

1. **Can't connect to Supabase**
   ```bash
   supabase logout && supabase login
   supabase link --project-ref [YOUR-REF]
   ```

2. **Edge Functions not working**
   - Check secrets are set in Supabase Dashboard
   - View logs: `supabase functions logs [function-name]`

3. **Build errors**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

See [MIGRATION_ROADMAP.md](./MIGRATION_ROADMAP.md#troubleshooting) for more.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is private and proprietary.

---

## 📞 Support

- **Issues**: https://github.com/LumenSyntax/club-stride-link/issues
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

## 🎉 Acknowledgments

- Built with [Supabase](https://supabase.com)
- Deployed on [Vercel](https://vercel.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Components from [shadcn/ui](https://ui.shadcn.com)

---

**Made with ❤️ by Elite Run Club Team**
