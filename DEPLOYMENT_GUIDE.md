# Deployment Guide: Supabase & Vercel

This guide explains how to manage Supabase database migrations and deploy your application to Vercel.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Supabase CLI** (optional but recommended):
   ```bash
   npm install -g supabase
   ```

## 🗄️ Managing Supabase Migrations

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to your Supabase project dashboard**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Apply the new migration**
   - Open the file: `supabase/migrations/20260113_get_transactions_by_slug.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" to execute

4. **Verify the migration**
   - Go to "Database" → "Functions"
   - You should see `get_transactions_by_slug` in the list

### Option 2: Using Supabase CLI (Recommended for Production)

1. **Link your local project to Supabase**
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Supabase dashboard → Settings → General)

2. **Apply all pending migrations**
   ```bash
   supabase db push
   ```

3. **Or apply a specific migration**
   ```bash
   supabase migration up
   ```

### Option 3: Using Supabase Migration Tool (Manual)

1. **Access Supabase CLI in your project**
   ```bash
   # If you haven't initialized Supabase locally
   supabase init
   ```

2. **Push migrations to remote**
   ```bash
   supabase db push
   ```

## 🚀 Deploying to Vercel

### Step 1: Prepare Your Project

1. **Ensure your code is committed to Git**
   ```bash
   git add .
   git commit -m "Add transaction RPC and fix data fetching"
   git push origin main
   ```

### Step 2: Connect to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "Add New Project"**

3. **Import your Git repository**
   - Connect your GitHub/GitLab/Bitbucket account
   - Select the `bez-asset-tracker` repository

4. **Configure the project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   To find these values:
   - Go to Supabase Dashboard → Settings → API
   - Copy "Project URL" → `VITE_SUPABASE_URL`
   - Copy "anon public" key → `VITE_SUPABASE_ANON_KEY`

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

#### Option B: Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project or create new
   - Set environment variables when prompted

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Step 3: Configure Vercel Settings

1. **Update `vercel.json`** (already configured):
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

2. **Set up custom domain** (optional):
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add your custom domain

## 🔄 Continuous Deployment Workflow

### Recommended Workflow

1. **Make changes locally**
   ```bash
   # Make your code changes
   # Test locally with: npm run dev
   ```

2. **Create and apply Supabase migrations**
   ```bash
   # Create new migration file in supabase/migrations/
   # Apply via Supabase Dashboard or CLI
   ```

3. **Commit and push to Git**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

4. **Vercel automatically deploys**
   - Vercel detects the push
   - Runs build automatically
   - Deploys to production

### Manual Deployment

If you need to deploy manually:
```bash
vercel --prod
```

## 🔐 Environment Variables

### Required Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase Dashboard → Settings → API → anon public |

### Setting Environment Variables

1. **Via Vercel Dashboard**:
   - Project → Settings → Environment Variables
   - Add each variable
   - Select environments (Production, Preview, Development)
   - Click "Save"

2. **Via Vercel CLI**:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## 📝 Applying the New Migration

Since we just created `20260113_get_transactions_by_slug.sql`, you need to apply it:

### Quick Method (Supabase Dashboard):

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click "SQL Editor" → "New query"
4. Copy and paste this:

```sql
CREATE OR REPLACE FUNCTION public.get_transactions_by_slug(
  p_slug text,
  p_limit integer DEFAULT 10
)
RETURNS SETOF public.transactions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.* FROM public.transactions t
  JOIN public.organizations o ON o.id = t.org_id
  WHERE o.slug = p_slug
  ORDER BY t.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_transactions_by_slug(text, integer) TO anon;

NOTIFY pgrst, 'reload schema';
```

5. Click "Run"

## ✅ Verification Checklist

After deployment, verify:

- [ ] Supabase migration applied successfully
- [ ] Vercel deployment completed
- [ ] Environment variables set correctly
- [ ] Application loads without errors
- [ ] Dashboard shows technicians/assets (e.g., "Sam")
- [ ] No 401/400 errors in browser console
- [ ] NFC functionality works (if testing on mobile)

## 🐛 Troubleshooting

### Migration Issues

**Problem**: Migration fails with permission error
- **Solution**: Ensure you're using the correct Supabase project and have admin access

**Problem**: Function already exists
- **Solution**: The `CREATE OR REPLACE` should handle this, but if issues persist, drop first:
  ```sql
  DROP FUNCTION IF EXISTS public.get_transactions_by_slug(text, integer);
  ```

### Vercel Deployment Issues

**Problem**: Build fails
- **Solution**: Check build logs in Vercel dashboard for specific errors
- Common issues: Missing dependencies, TypeScript errors, environment variables

**Problem**: 401/400 errors after deployment
- **Solution**: 
  1. Verify environment variables are set correctly
  2. Check Supabase RLS policies
  3. Ensure migrations are applied

**Problem**: App shows blank page
- **Solution**: 
  1. Check browser console for errors
  2. Verify `vercel.json` rewrite rules
  3. Check that `dist` folder is being built correctly

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

## 🔄 Updating After Changes

When you make changes:

1. **Code changes**: Just push to Git, Vercel auto-deploys
2. **Database changes**: Apply migrations via Supabase Dashboard or CLI
3. **Environment variable changes**: Update in Vercel Dashboard, redeploy

---

**Need Help?** Check the error logs in:
- Vercel Dashboard → Deployments → [Your Deployment] → Logs
- Supabase Dashboard → Logs → Postgres Logs
