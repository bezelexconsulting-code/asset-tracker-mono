#!/bin/bash

# Setup Automation Script for GitHub → Vercel → Supabase
# This script helps you gather the necessary credentials

echo "🚀 Setting up automated deployment pipeline..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will help you gather the credentials needed for automation.${NC}"
echo ""

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    echo -e "${YELLOW}Creating .env.example file...${NC}"
    cat > .env.example << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# These are for GitHub Actions (not needed in .env)
# SUPABASE_ACCESS_TOKEN=
# SUPABASE_PROJECT_ID=
# SUPABASE_DB_PASSWORD=
# VERCEL_TOKEN=
# VERCEL_ORG_ID=
# VERCEL_PROJECT_ID=
EOF
    echo -e "${GREEN}✅ Created .env.example${NC}"
fi

echo ""
echo -e "${BLUE}📋 You'll need to collect the following credentials:${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}1. SUPABASE CREDENTIALS${NC}"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   a) Access Token:"
echo "      → Go to: https://app.supabase.com/account/tokens"
echo "      → Click 'Generate new token'"
echo "      → Copy the token"
echo ""
echo "   b) Project ID (Reference ID):"
echo "      → Go to: https://app.supabase.com → Your Project → Settings → General"
echo "      → Copy 'Reference ID'"
echo ""
echo "   c) Database Password:"
echo "      → Go to: https://app.supabase.com → Your Project → Settings → Database"
echo "      → Copy your database password (or reset if needed)"
echo ""
echo "   d) Project URL & Anon Key (for Vercel env vars):"
echo "      → Go to: https://app.supabase.com → Your Project → Settings → API"
echo "      → Copy 'Project URL' → VITE_SUPABASE_URL"
echo "      → Copy 'anon public' key → VITE_SUPABASE_ANON_KEY"
echo ""
echo -e "${YELLOW}2. VERCEL CREDENTIALS${NC}"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   a) Vercel Token:"
echo "      → Go to: https://vercel.com/account/tokens"
echo "      → Click 'Create Token'"
echo "      → Name it 'GitHub Actions'"
echo "      → Copy the token"
echo ""
echo "   b) Organization ID & Project ID:"
echo "      Option 1: Run 'vercel link' locally:"
echo "        → Run: vercel link"
echo "        → Check .vercel/project.json"
echo ""
echo "      Option 2: From Vercel Dashboard:"
echo "        → Go to: https://vercel.com/dashboard"
echo "        → Select your project → Settings → General"
echo "        → Copy 'Project ID'"
echo "        → Organization ID is in the URL or Settings"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI is installed${NC}"
    read -p "Would you like to link your Vercel project now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel link
        if [ -f ".vercel/project.json" ]; then
            echo ""
            echo -e "${GREEN}✅ Vercel project linked!${NC}"
            echo "   Check .vercel/project.json for your project ID and org ID"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI not installed${NC}"
    echo "   Install with: npm install -g vercel"
fi

echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1. Collect all the credentials listed above"
echo "2. Go to your GitHub repository"
echo "3. Navigate to: Settings → Secrets and variables → Actions"
echo "4. Add the following secrets:"
echo ""
echo "   Required Secrets:"
echo "   ─────────────────"
echo "   • SUPABASE_ACCESS_TOKEN"
echo "   • SUPABASE_PROJECT_ID"
echo "   • SUPABASE_DB_PASSWORD"
echo "   • VERCEL_TOKEN"
echo "   • VERCEL_ORG_ID"
echo "   • VERCEL_PROJECT_ID"
echo ""
echo "5. In Vercel Dashboard, add environment variables:"
echo "   • VITE_SUPABASE_URL"
echo "   • VITE_SUPABASE_ANON_KEY"
echo ""
echo -e "${GREEN}✅ Setup files are ready in .github/workflows/${NC}"
echo ""
echo "Once you've added the secrets, push to main branch and automation will run!"
