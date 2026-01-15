# Integration Setup Guide: GitHub → Vercel → Supabase

This guide helps you set up automated workflows connecting GitHub, Vercel, and Supabase.

## 🔗 What We'll Set Up

1. **GitHub → Vercel**: Automatic deployments on push
2. **GitHub Actions**: Automated Supabase migrations
3. **Vercel Environment Variables**: Secure configuration
4. **Supabase Webhooks** (optional): Trigger actions on DB changes

## 📋 Prerequisites

- GitHub repository with your code
- Vercel account
- Supabase account
- GitHub Personal Access Token (for Actions)

---

## 1️⃣ Connect GitHub to Vercel

### Step 1: Link Repository in Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Authorize Vercel to access your GitHub account
5. Select your `bez-asset-tracker` repository
6. Click **"Import"**

### Step 2: Configure Build Settings

Vercel should auto-detect Vite, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables, add:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Select all environments** (Production, Preview, Development)

### Step 4: Deploy

Click **"Deploy"** - Vercel will now auto-deploy on every push to main!

---

## 2️⃣ Automated Supabase Migrations with GitHub Actions

Set up automatic migration application when you push migration files.

### Step 1: Create GitHub Actions Workflow

Create `.github/workflows/supabase-migrations.yml`:

```yaml
name: Apply Supabase Migrations

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Apply migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: |
          supabase link --project-ref $SUPABASE_PROJECT_ID
          supabase db push
```

### Step 2: Get Supabase Credentials

1. **Supabase Access Token**:
   - Go to [app.supabase.com/account/tokens](https://app.supabase.com/account/tokens)
   - Click "Generate new token"
   - Copy the token

2. **Project ID**:
   - Go to Supabase Dashboard → Settings → General
   - Copy "Reference ID"

3. **Database Password**:
   - Go to Settings → Database
   - Copy your database password (or reset if needed)

### Step 3: Add GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add these secrets:

   - `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
   - `SUPABASE_PROJECT_ID`: Your project reference ID
   - `SUPABASE_DB_PASSWORD`: Your database password

### Step 4: Test the Workflow

1. Make a small change to a migration file (or create a test one)
2. Commit and push:
   ```bash
   git add supabase/migrations/
   git commit -m "Test migration workflow"
   git push origin main
   ```
3. Check GitHub Actions tab to see it run

---

## 3️⃣ Enhanced Workflow: Full CI/CD Pipeline

For a complete setup with testing and deployment:

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run check
      
      - name: Run tests
        run: npm run test

  migrate:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      
      - name: Apply migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: |
          supabase link --project-ref $SUPABASE_PROJECT_ID
          supabase db push

  deploy:
    needs: [test, migrate]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 4️⃣ Vercel CLI Integration (Alternative)

If you prefer using Vercel CLI in GitHub Actions:

### Get Vercel Credentials

1. **Vercel Token**:
   ```bash
   vercel login
   vercel link
   ```
   Or get from: [vercel.com/account/tokens](https://vercel.com/account/tokens)

2. **Org ID & Project ID**:
   - Found in `.vercel/project.json` after running `vercel link`
   - Or in Vercel Dashboard → Project Settings

### Add to GitHub Secrets

- `VERCEL_TOKEN`: Your Vercel token
- `VERCEL_ORG_ID`: Your organization ID
- `VERCEL_PROJECT_ID`: Your project ID

---

## 5️⃣ Supabase Webhooks (Optional)

Set up webhooks to trigger actions when database changes occur.

### Example: Notify on Migration

1. Go to Supabase Dashboard → Database → Webhooks
2. Create webhook:
   - **Name**: Migration Notification
   - **Table**: `schema_migrations`
   - **Events**: INSERT, UPDATE
   - **URL**: Your webhook endpoint (e.g., Vercel serverless function)

### Create Vercel Serverless Function

Create `api/webhooks/supabase.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (req.headers['x-webhook-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle webhook payload
  const payload = req.body;
  console.log('Migration event:', payload);

  // Your logic here (e.g., send notification, invalidate cache)

  return res.status(200).json({ received: true });
}
```

---

## 6️⃣ Environment Variable Management

### Vercel Environment Variables

Best practice: Set variables per environment

1. **Production**: Vercel Dashboard → Settings → Environment Variables
2. **Preview**: Same location, select "Preview"
3. **Development**: Same location, select "Development"

### Supabase Environment Variables

For server-side operations, use Supabase secrets:

1. Go to Supabase Dashboard → Settings → API
2. Use service role key (never expose in client!)

---

## 7️⃣ Monitoring & Alerts

### Set Up Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Supabase Logs**: Monitor in Dashboard → Logs
3. **GitHub Actions**: Check workflow runs

### Error Notifications

Set up alerts for:
- Failed deployments (Vercel)
- Failed migrations (GitHub Actions)
- Database errors (Supabase)

---

## 🔐 Security Best Practices

1. **Never commit secrets** to Git
2. **Use GitHub Secrets** for sensitive data
3. **Rotate tokens** regularly
4. **Use environment-specific** variables
5. **Enable 2FA** on all accounts

---

## 📝 Quick Reference: What to Share

When asking for help, you can share (safely):

✅ **Safe to share:**
- Error messages (without tokens)
- Configuration files (without secrets)
- Migration file contents
- Build logs (without credentials)

❌ **Never share:**
- API keys or tokens
- Database passwords
- Access tokens
- Private keys

---

## 🚀 Quick Start Commands

```bash
# 1. Link Vercel project
vercel link

# 2. Deploy to preview
vercel

# 3. Deploy to production
vercel --prod

# 4. Link Supabase
supabase link --project-ref your-project-ref

# 5. Push migrations
supabase db push

# 6. Check status
vercel ls
supabase status
```

---

## 🆘 Troubleshooting

### Vercel Deployment Fails

- Check build logs in Vercel dashboard
- Verify environment variables are set
- Ensure `vercel.json` is correct

### Migrations Don't Apply

- Verify Supabase credentials in GitHub Secrets
- Check GitHub Actions logs
- Ensure migration files are in correct format

### Environment Variables Not Working

- Verify variables are set for correct environment
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

---

## 📚 Next Steps

1. ✅ Connect GitHub to Vercel
2. ✅ Set up GitHub Actions for migrations
3. ✅ Configure environment variables
4. ✅ Test the full pipeline
5. ✅ Set up monitoring

---

**Need help?** Share:
- Error messages (without secrets)
- Configuration files (without tokens)
- What you've tried so far
