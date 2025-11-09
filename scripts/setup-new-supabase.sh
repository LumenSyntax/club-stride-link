#!/bin/bash

# =============================================================================
# Setup New Supabase Project - Automated Script
# =============================================================================
# This script automates the initial setup of your new Supabase project
# after migrating from Lovable.
#
# Usage: ./scripts/setup-new-supabase.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✅ ${NC}$1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  ${NC}$1"
}

log_error() {
    echo -e "${RED}❌ ${NC}$1"
}

# =============================================================================
# Step 0: Pre-flight Checks
# =============================================================================

echo ""
echo "======================================"
echo "🚀 Supabase Migration Setup"
echo "======================================"
echo ""

log_info "Running pre-flight checks..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    exit 1
fi

log_success "Supabase CLI found: $(supabase --version)"

# Check if logged in
if ! supabase projects list &> /dev/null; then
    log_warning "Not logged in to Supabase CLI"
    echo ""
    log_info "Logging in..."
    supabase login
fi

log_success "Authenticated with Supabase"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi

log_success "Node.js found: $(node --version)"

echo ""

# =============================================================================
# Step 1: Get Supabase Project Details
# =============================================================================

log_info "Step 1: Configure Supabase Project"
echo "--------------------------------------"

# Prompt for project ref
read -p "Enter your Supabase Project Ref (from dashboard): " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    log_error "Project ref is required"
    exit 1
fi

log_success "Project ref: $PROJECT_REF"

# Prompt for database password
read -sp "Enter your Supabase database password: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    log_error "Database password is required"
    exit 1
fi

echo ""

# =============================================================================
# Step 2: Link Project
# =============================================================================

log_info "Step 2: Linking local project to Supabase..."
echo "--------------------------------------"

supabase link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD" || {
    log_error "Failed to link project"
    exit 1
}

log_success "Project linked successfully"
echo ""

# =============================================================================
# Step 3: Apply Database Migrations
# =============================================================================

log_info "Step 3: Applying database migrations..."
echo "--------------------------------------"

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
    log_error "No migrations directory found"
    log_info "Create migrations directory: supabase/migrations/"
    exit 1
fi

# Count migrations
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    log_warning "No SQL migrations found in supabase/migrations/"
else
    log_info "Found $MIGRATION_COUNT migration(s) to apply"
fi

# Push migrations
log_info "Pushing migrations to remote database..."
supabase db push || {
    log_error "Failed to apply migrations"
    exit 1
}

log_success "All migrations applied successfully"
echo ""

# =============================================================================
# Step 4: Deploy Edge Functions
# =============================================================================

log_info "Step 4: Deploying Edge Functions..."
echo "--------------------------------------"

# Check if functions directory exists
if [ ! -d "supabase/functions" ]; then
    log_warning "No Edge Functions directory found"
else
    # Get list of functions
    FUNCTIONS=$(ls -d supabase/functions/*/ 2>/dev/null | xargs -n 1 basename)

    if [ -z "$FUNCTIONS" ]; then
        log_warning "No Edge Functions found"
    else
        log_info "Found Edge Functions to deploy:"
        echo "$FUNCTIONS" | sed 's/^/  - /'
        echo ""

        read -p "Deploy all Edge Functions? (y/n) " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for FUNC in $FUNCTIONS; do
                log_info "Deploying: $FUNC"
                supabase functions deploy "$FUNC" || {
                    log_error "Failed to deploy $FUNC"
                }
            done
            log_success "All Edge Functions deployed"
        else
            log_warning "Skipped Edge Function deployment"
        fi
    fi
fi

echo ""

# =============================================================================
# Step 5: Create .env.local
# =============================================================================

log_info "Step 5: Creating .env.local file..."
echo "--------------------------------------"

if [ -f ".env.local" ]; then
    log_warning ".env.local already exists"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Skipping .env.local creation"
    else
        cp .env.example .env.local
        log_success "Created .env.local from .env.example"
    fi
else
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        log_success "Created .env.local from .env.example"
    else
        log_error ".env.example not found"
    fi
fi

# Prompt to fill in values
echo ""
log_warning "⚠️  IMPORTANT: Update .env.local with your actual credentials!"
echo ""
echo "You need to set:"
echo "  1. VITE_SUPABASE_URL=https://$PROJECT_REF.supabase.co"
echo "  2. VITE_SUPABASE_ANON_KEY=<from Supabase Dashboard>"
echo "  3. VITE_STRAVA_CLIENT_ID=<from Strava API settings>"
echo "  4. Other API keys as needed"
echo ""

read -p "Press Enter when you've updated .env.local..."

echo ""

# =============================================================================
# Step 6: Install Dependencies
# =============================================================================

log_info "Step 6: Installing dependencies..."
echo "--------------------------------------"

if [ -f "package-lock.json" ]; then
    log_info "Running npm ci..."
    npm ci || {
        log_error "Failed to install dependencies"
        exit 1
    }
elif [ -f "yarn.lock" ]; then
    log_info "Running yarn install..."
    yarn install || {
        log_error "Failed to install dependencies"
        exit 1
    }
elif [ -f "pnpm-lock.yaml" ]; then
    log_info "Running pnpm install..."
    pnpm install || {
        log_error "Failed to install dependencies"
        exit 1
    }
else
    log_info "Running npm install..."
    npm install || {
        log_error "Failed to install dependencies"
        exit 1
    }
fi

log_success "Dependencies installed successfully"
echo ""

# =============================================================================
# Step 7: Verify Setup
# =============================================================================

log_info "Step 7: Verifying setup..."
echo "--------------------------------------"

# Check if tables exist
log_info "Checking database tables..."
TABLES=$(supabase db remote ls 2>&1 | grep -c "public\." || true)

if [ "$TABLES" -gt 0 ]; then
    log_success "Database tables created successfully"
else
    log_warning "No tables found - migrations may not have applied"
fi

# Check if functions are deployed
log_info "Checking deployed Edge Functions..."
DEPLOYED_FUNCTIONS=$(supabase functions list 2>&1 | grep -c "Deployed" || true)

if [ "$DEPLOYED_FUNCTIONS" -gt 0 ]; then
    log_success "Edge Functions deployed: $DEPLOYED_FUNCTIONS"
else
    log_warning "No Edge Functions deployed"
fi

echo ""

# =============================================================================
# Step 8: Next Steps
# =============================================================================

log_success "Setup complete! 🎉"
echo ""
echo "======================================"
echo "📋 Next Steps"
echo "======================================"
echo ""
echo "1. Configure Edge Function secrets in Supabase Dashboard:"
echo "   https://app.supabase.com/project/$PROJECT_REF/settings/functions"
echo ""
echo "   Required secrets:"
echo "   - STRAVA_CLIENT_ID"
echo "   - STRAVA_CLIENT_SECRET"
echo "   - TRUTHSYNTAX_URL (optional)"
echo "   - TRUTHSYNTAX_API_KEY (optional)"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Test the application:"
echo "   - Open http://localhost:5173"
echo "   - Sign up / Login"
echo "   - Connect Strava"
echo "   - Calculate Elite Score"
echo ""
echo "4. Deploy to production:"
echo "   - Follow Phase 3 in MIGRATION_ROADMAP.md"
echo "   - Deploy to Vercel: vercel --prod"
echo ""
echo "======================================"
echo ""
log_info "For detailed instructions, see: MIGRATION_ROADMAP.md"
echo ""
