#!/bin/bash

# =============================================================================
# Verify Supabase Migration - Health Check Script
# =============================================================================
# This script verifies that your Supabase migration completed successfully
# and all systems are operational.
#
# Usage: ./scripts/verify-migration.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✅ ${NC}$1"
    ((PASS_COUNT++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  ${NC}$1"
    ((WARN_COUNT++))
}

log_error() {
    echo -e "${RED}❌ ${NC}$1"
    ((FAIL_COUNT++))
}

check_command() {
    if command -v "$1" &> /dev/null; then
        log_success "$2: $(command -v $1)"
        return 0
    else
        log_error "$2 not found"
        return 1
    fi
}

echo ""
echo "======================================"
echo "🔍 Supabase Migration Health Check"
echo "======================================"
echo ""

# =============================================================================
# Section 1: CLI Tools
# =============================================================================

echo "1. CLI Tools"
echo "--------------------------------------"

check_command "supabase" "Supabase CLI"
check_command "node" "Node.js"
check_command "npm" "npm"

echo ""

# =============================================================================
# Section 2: Project Configuration
# =============================================================================

echo "2. Project Configuration"
echo "--------------------------------------"

# Check if linked to Supabase
if supabase projects list &> /dev/null; then
    PROJECT_REF=$(supabase status 2>&1 | grep "Project ID" | awk '{print $3}' || echo "")
    if [ -n "$PROJECT_REF" ]; then
        log_success "Linked to Supabase project: $PROJECT_REF"
    else
        log_warning "Supabase CLI authenticated but project not linked"
    fi
else
    log_error "Not authenticated with Supabase CLI"
fi

# Check .env.local exists
if [ -f ".env.local" ]; then
    log_success ".env.local file exists"

    # Check if required variables are set (not empty)
    if grep -q "VITE_SUPABASE_URL=https://" .env.local; then
        log_success "VITE_SUPABASE_URL is configured"
    else
        log_warning "VITE_SUPABASE_URL not configured in .env.local"
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY=eyJ" .env.local; then
        log_success "VITE_SUPABASE_ANON_KEY is configured"
    else
        log_warning "VITE_SUPABASE_ANON_KEY not configured in .env.local"
    fi
else
    log_error ".env.local file not found"
fi

# Check package.json exists
if [ -f "package.json" ]; then
    log_success "package.json exists"
else
    log_error "package.json not found"
fi

# Check node_modules installed
if [ -d "node_modules" ]; then
    log_success "node_modules directory exists"
else
    log_warning "node_modules not found - run npm install"
fi

echo ""

# =============================================================================
# Section 3: Database
# =============================================================================

echo "3. Database"
echo "--------------------------------------"

# Check if migrations exist
if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        log_success "Found $MIGRATION_COUNT migration file(s)"
    else
        log_warning "No migration files found"
    fi
else
    log_error "supabase/migrations directory not found"
fi

# Check if can connect to remote database
if supabase db remote ls &> /dev/null; then
    log_success "Can connect to remote database"

    # List tables
    TABLE_COUNT=$(supabase db remote ls 2>&1 | grep -c "public\." || echo "0")
    if [ "$TABLE_COUNT" -gt 0 ]; then
        log_success "Database has $TABLE_COUNT tables"
    else
        log_warning "No tables found in database"
    fi
else
    log_error "Cannot connect to remote database"
fi

echo ""

# =============================================================================
# Section 4: Edge Functions
# =============================================================================

echo "4. Edge Functions"
echo "--------------------------------------"

# Check if functions directory exists
if [ -d "supabase/functions" ]; then
    FUNC_COUNT=$(ls -d supabase/functions/*/ 2>/dev/null | wc -l)
    if [ "$FUNC_COUNT" -gt 0 ]; then
        log_success "Found $FUNC_COUNT Edge Function(s)"

        # List functions
        FUNCTIONS=$(ls -d supabase/functions/*/ 2>/dev/null | xargs -n 1 basename)
        echo "$FUNCTIONS" | while read -r func; do
            echo "   - $func"
        done
    else
        log_warning "No Edge Functions found"
    fi
else
    log_warning "supabase/functions directory not found"
fi

# Check if functions are deployed
if supabase functions list &> /dev/null; then
    DEPLOYED_COUNT=$(supabase functions list 2>&1 | grep -c "Deployed" || echo "0")
    if [ "$DEPLOYED_COUNT" -gt 0 ]; then
        log_success "$DEPLOYED_COUNT Edge Function(s) deployed"
    else
        log_warning "No Edge Functions deployed"
    fi
else
    log_warning "Cannot check deployed functions"
fi

echo ""

# =============================================================================
# Section 5: Frontend Build
# =============================================================================

echo "5. Frontend Build"
echo "--------------------------------------"

# Check if can build
log_info "Attempting to build frontend..."
if npm run build &> /tmp/build-output.log; then
    log_success "Frontend builds successfully"

    # Check if dist directory exists
    if [ -d "dist" ]; then
        log_success "Build output (dist/) created"

        # Check dist size
        DIST_SIZE=$(du -sh dist | awk '{print $1}')
        log_info "Build size: $DIST_SIZE"
    else
        log_warning "dist/ directory not found after build"
    fi
else
    log_error "Frontend build failed"
    log_info "Check /tmp/build-output.log for details"
fi

echo ""

# =============================================================================
# Section 6: Required Tables Check
# =============================================================================

echo "6. Required Database Tables"
echo "--------------------------------------"

REQUIRED_TABLES=(
    "profiles"
    "activities"
    "elite_scores"
    "elite_score_signals"
    "elite_badges"
    "user_badges"
    "elite_recommendations"
    "truth_validation_logs"
)

log_info "Checking for Elite Score system tables..."

if supabase db remote ls &> /dev/null; then
    for table in "${REQUIRED_TABLES[@]}"; do
        if supabase db remote ls 2>&1 | grep -q "public\.$table"; then
            log_success "Table exists: $table"
        else
            log_error "Table missing: $table"
        fi
    done
else
    log_warning "Cannot verify tables - not connected to database"
fi

echo ""

# =============================================================================
# Section 7: Git Status
# =============================================================================

echo "7. Git Repository"
echo "--------------------------------------"

if [ -d ".git" ]; then
    log_success "Git repository initialized"

    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    log_info "Current branch: $CURRENT_BRANCH"

    # Check if clean or dirty
    if git diff-index --quiet HEAD --; then
        log_success "Working directory is clean"
    else
        log_warning "Working directory has uncommitted changes"
    fi

    # Check remote
    if git remote -v | grep -q "origin"; then
        REMOTE_URL=$(git remote get-url origin)
        log_success "Remote configured: $REMOTE_URL"
    else
        log_warning "No remote configured"
    fi
else
    log_error "Not a git repository"
fi

echo ""

# =============================================================================
# Section 8: Documentation
# =============================================================================

echo "8. Documentation"
echo "--------------------------------------"

DOCS=(
    "README.md"
    "MIGRATION_ROADMAP.md"
    "ELITE_SCORE_README.md"
    "COMMIT_SUMMARY.md"
    ".env.example"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        log_success "Documentation exists: $doc"
    else
        log_warning "Documentation missing: $doc"
    fi
done

echo ""

# =============================================================================
# Section 9: Security Checks
# =============================================================================

echo "9. Security"
echo "--------------------------------------"

# Check if .env files are gitignored
if grep -q "\.env" .gitignore 2>/dev/null; then
    log_success ".env files are gitignored"
else
    log_error ".env not in .gitignore - SECURITY RISK!"
fi

# Check if .env.local is not committed
if git ls-files --error-unmatch .env.local &> /dev/null; then
    log_error ".env.local is tracked in git - SECURITY RISK!"
else
    log_success ".env.local not tracked in git"
fi

# Check for hardcoded secrets (basic check)
if grep -r "sk_live_" src/ 2>/dev/null | grep -v node_modules; then
    log_error "Potential hardcoded secrets found in src/"
else
    log_success "No obvious hardcoded secrets in src/"
fi

echo ""

# =============================================================================
# Final Report
# =============================================================================

echo "======================================"
echo "📊 Final Report"
echo "======================================"
echo ""
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${YELLOW}Warnings: $WARN_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Your migration is complete.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start dev server: npm run dev"
    echo "  2. Test application: http://localhost:5173"
    echo "  3. Deploy to production: vercel --prod"
    exit 0
elif [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Migration complete with warnings.${NC}"
    echo ""
    echo "Review warnings above and address as needed."
    exit 0
else
    echo -e "${RED}❌ Migration incomplete. Please fix errors above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Run: supabase link --project-ref [your-ref]"
    echo "  - Run: supabase db push"
    echo "  - Run: supabase functions deploy [function-name]"
    echo "  - Configure .env.local with proper credentials"
    exit 1
fi
