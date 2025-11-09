#!/bin/bash

# Elite Score System - Setup Script
# This script helps set up the Elite Score system in your Supabase project

set -e

echo "🏃 Elite Score System - Setup Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Step 1: Database Migration
echo "📊 Step 1: Applying Database Migration"
echo "--------------------------------------"
read -p "Apply Elite Score database migration? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing migration to Supabase..."
    npx supabase db push || {
        echo -e "${RED}❌ Migration failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Migration applied successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping migration${NC}"
fi
echo ""

# Step 2: Deploy Edge Functions
echo "⚡ Step 2: Deploying Edge Functions"
echo "-----------------------------------"
read -p "Deploy calculate-elite-score Edge Function? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploying Edge Function..."
    npx supabase functions deploy calculate-elite-score || {
        echo -e "${RED}❌ Edge Function deployment failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Edge Function deployed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping Edge Function deployment${NC}"
fi
echo ""

# Step 3: Set Environment Variables
echo "🔐 Step 3: Environment Variables"
echo "--------------------------------"
echo "The following environment variables need to be configured:"
echo ""
echo "Required:"
echo "  VITE_SUPABASE_URL=your-supabase-url"
echo "  VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key"
echo ""
echo "Optional (for TruthSyntax integration):"
echo "  VITE_TRUTHSYNTAX_URL=http://localhost:8787"
echo "  VITE_TRUTHSYNTAX_API_KEY=your-truthsyntax-key"
echo ""
read -p "Have you configured these in .env.local? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ Environment variables configured${NC}"
else
    echo -e "${YELLOW}⚠️  Please configure environment variables in .env.local${NC}"
fi
echo ""

# Step 4: Configure Edge Function Secrets
echo "🔑 Step 4: Edge Function Secrets"
echo "--------------------------------"
echo "You need to set the following secrets in Supabase Dashboard:"
echo ""
echo "1. Go to: https://app.supabase.com/project/_/settings/functions"
echo "2. Add these secrets:"
echo "   - TRUTHSYNTAX_URL (optional)"
echo "   - TRUTHSYNTAX_API_KEY (optional)"
echo ""
read -p "Have you configured these secrets? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ Secrets configured${NC}"
else
    echo -e "${YELLOW}⚠️  TruthSyntax validation will use fallback mode${NC}"
fi
echo ""

# Step 5: Verify Installation
echo "🧪 Step 5: Verification"
echo "----------------------"
echo "Running verification checks..."
echo ""

# Check if tables exist
echo "Checking database tables..."
npx supabase db diff --schema public > /dev/null 2>&1 && {
    echo -e "${GREEN}✅ Database connection successful${NC}"
} || {
    echo -e "${RED}❌ Cannot connect to database${NC}"
}

# Check if functions are deployed
echo "Checking Edge Functions..."
npx supabase functions list | grep -q "calculate-elite-score" && {
    echo -e "${GREEN}✅ calculate-elite-score function found${NC}"
} || {
    echo -e "${YELLOW}⚠️  calculate-elite-score function not deployed${NC}"
}

echo ""

# Step 6: Test the system
echo "🚀 Step 6: Testing"
echo "-----------------"
read -p "Would you like to run a test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting development server..."
    echo "Navigate to http://localhost:5173/elite-score"
    echo ""
    npm run dev
else
    echo -e "${YELLOW}⚠️  Skipping test${NC}"
fi
echo ""

# Final Summary
echo ""
echo "======================================"
echo "🎉 Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Navigate to: http://localhost:5173/elite-score"
echo "3. Log in with your account"
echo "4. Add some activities (or sync from Strava)"
echo "5. Click 'CALCULATE MY SCORE'"
echo ""
echo "📚 For detailed documentation, see: ELITE_SCORE_README.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
