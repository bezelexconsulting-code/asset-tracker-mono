# 🚀 Automated Setup Guide

This guide walks you through setting up **fully automated** deployments and migrations.

## ✅ What's Already Created

I've created these files for you:

- ✅ `.github/workflows/supabase-migrations.yml` - Auto-applies migrations
- ✅ `.github/workflows/ci-cd.yml` - Full CI/CD pipeline
- ✅ `setup-automation.sh` - Helper script to gather credentials

## 🎯 Quick Setup (5 Steps)

### Step 1: Run the Setup Script

```bash
chmod +x setup-automation.sh
./setup-automation.sh
```

This will guide you through collecting credentials.

### Step 2: Get Supabase Credentials

1. **Access Token**:
   - Go to: https://app.supabase.com/account/tokens
   - Click "Generate new token"
   - Copy it

2. **Project ID**:
   - Go to: Supabase Dashboard → Settings → General
   - Copy "Reference ID"

3. **Database Password**:
   - Go to: Settings → Database
   - Copy your password

4. **Project URL & Anon Key** (for Vercel):
   - Go to: Settings → API
   - Copy "Project URL" → This is `VITE_SUPABASE_URL`
   - Copy "anon public" key → This is `VITE_SUPABASE_ANON_KEY`

### Step 3: Get Vercel Credentials

1. **Vercel Token**:
   - Go to: https://vercel.com/account/tokens
   - Create new token named "GitHub Actions"
   - Copy it

2. **Project ID & Org ID**:
   ```bash
   # Option 1: Link locally
   vercel link
   # Check .vercel/project.json
   
   # Option 2: From Dashboard
   # Vercel Dashboard → Project → Settings → General
   ```

### Step 4: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these **6 secrets**:

   | Secret Name | Value |
   |------------|-------|
   | `SUPABASE_ACCESS_TOKEN` | Your Supabase access token |
   | `SUPABASE_PROJECT_ID` | Your Supabase project reference ID |
   | `SUPABASE_DB_PASSWORD` | Your Supabase database password |
   | `VERCEL_TOKEN` | Your Vercel token |
   | `VERCEL_ORG_ID` | Your Vercel organization ID |
   | `VERCEL_PROJECT_ID` | Your Vercel project ID |

### Step 5: Add Vercel Environment Variables

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these **2 variables**:

   | Variable | Value |
   |---------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

   **Important**: Select all environments (Production, Preview, Development)

## 🎉 You're Done!

Now everything is automated:

- ✅ **Push to GitHub** → Auto-deploys to Vercel
- ✅ **Add migration file** → Auto-applies to Supabase
- ✅ **Tests run** → Before deployment
- ✅ **Type checking** → Before deployment

## 🧪 Test It

1. **Test Migration Automation**:
   ```bash
   # Make a small change to a migration file
   echo "-- Test comment" >> supabase/migrations/20260113_get_transactions_by_slug.sql
   git add supabase/migrations/
   git commit -m "Test migration automation"
   git push origin main
   ```
   
   Check: GitHub → Actions tab → Should see "Apply Supabase Migrations" run

2. **Test Deployment**:
   ```bash
   # Make a small code change
   echo "// Test" >> src/App.tsx
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
   
   Check: Vercel Dashboard → Should see new deployment

## 📊 What Happens Automatically

### When You Push Migration Files:

1. GitHub Actions detects changes in `supabase/migrations/`
2. Links to your Supabase project
3. Applies all pending migrations
4. Reports success/failure

### When You Push Code:

1. GitHub Actions runs tests
2. If tests pass, deploys to Vercel
3. Vercel builds and deploys your app
4. Your app is live!

## 🔍 Monitoring

### Check GitHub Actions:
- Go to: Your repo → **Actions** tab
- See all workflow runs and their status

### Check Vercel:
- Go to: [vercel.com/dashboard](https://vercel.com/dashboard)
- See deployment history and logs

### Check Supabase:
- Go to: Supabase Dashboard → **Logs**
- See migration history

## 🐛 Troubleshooting

### Migration Fails

**Error**: "Authentication failed"
- ✅ Check `SUPABASE_ACCESS_TOKEN` is correct
- ✅ Verify token hasn't expired

**Error**: "Project not found"
- ✅ Check `SUPABASE_PROJECT_ID` matches your reference ID
- ✅ Ensure project is active

**Error**: "Database connection failed"
- ✅ Check `SUPABASE_DB_PASSWORD` is correct
- ✅ Verify database is accessible

### Deployment Fails

**Error**: "Vercel authentication failed"
- ✅ Check `VERCEL_TOKEN` is valid
- ✅ Verify token has correct permissions

**Error**: "Project not found"
- ✅ Check `VERCEL_PROJECT_ID` matches your project
- ✅ Verify `VERCEL_ORG_ID` is correct

**Error**: "Build failed"
- ✅ Check Vercel build logs
- ✅ Verify environment variables are set
- ✅ Check for TypeScript/build errors

## 🔐 Security Notes

- ✅ Secrets are encrypted in GitHub
- ✅ Never commit secrets to code
- ✅ Use different tokens for different environments
- ✅ Rotate tokens regularly

## 📝 Quick Reference

### Manual Commands (if needed)

```bash
# Apply migrations manually
supabase link --project-ref YOUR_PROJECT_ID
supabase db push

# Deploy to Vercel manually
vercel --prod

# Check status
vercel ls
supabase status
```

### File Locations

- Workflows: `.github/workflows/`
- Migrations: `supabase/migrations/`
- Vercel config: `vercel.json`
- Environment: `.env` (local only, never commit!)

## 🎓 Next Steps

1. ✅ Set up monitoring/alerting (optional)
2. ✅ Configure custom domain (optional)
3. ✅ Set up staging environment (optional)
4. ✅ Add more automated tests (optional)

---

**Need Help?** Check the workflow logs in GitHub Actions for detailed error messages!
