## Goals
- Focus the product on core asset tracking: maintenance, reporting, exporting, asset CRUD, and NFC read/write
- Reduce scope: drop Tickets and Flags; keep only Admin and Technician roles for org users
- Stabilize schema and remove legacy tables to eliminate silent failures
- Ensure both apps (Admin portal and Technician app) work online/offline and deploy cleanly to Vercel

## Current Issues (from simulation)
- Mixed tables and foreign keys: transactions_v2 → assets_v2 mismatch; legacy tables co-exist with new ones
- API gaps: client code calls /api/send-email; no serverless function; Vercel rewrite intercepts /api
- Auth/route guards: ProtectedRoute uses non-existent loading flag and wrong redirect; tech routes unguarded
- Env usage: process.env in client code; should use import.meta.env
- Org creation on visit: auto-creates organizations in AppLayout, easy to abuse

## Scope Per App
### Admin Portal (root app under "/:org")
- Assets: create/read/update/delete, image upload, categories, locations, clients
- Check-in/out: status changes, location assignments, audit trail
- Maintenance: Jobs with status, schedule, assignments, checklists, notes, next service date
- NFC Management: bind tags to assets, read/write payload, verify tag ownership and log writes
- Reporting & Export: CSV exports for assets, transactions, maintenance jobs; summary dashboards
- Users: only Admins and Technicians; manage technicians; remove any superadmin references here

### Technician App (under "/:org/tech")
- Login as Technician; view assigned jobs and assets
- Perform check-in/out; complete maintenance tasks; add notes & images
- NFC: scan to fetch asset; optional write limited to maintenance confirmation
- Offline-first queue: record transactions offline, sync when online

### Super Admin (separate app in /super-admin)
- Minimal: org provisioning and branding only (optional)
- Remove flags and tickets pages; drop feature variability (all orgs same feature set)

## Database and Realtime
- Canonical tables: organizations, clients, locations, categories, assets, technicians, jobs, activities, transactions, nfc_tags
- Remove/replace: assets_v2, transactions_v2, feature_flags, flags, tickets, requests (migrate data if any; otherwise drop)
- Transactions: asset_id uuid → assets(id); technician_id uuid; org_id uuid; type; notes; created_at
- Jobs for maintenance: existing schema with status, due dates, next_service_at, checklist
- Publish realtime only for canonical tables; update subscriptions accordingly

## Auth & Security
- Roles: Admin and Technician only for org users
- Guards: RequireAdmin for admin pages; add RequireTechnician for tech pages
- Login fixes: import resolveOrgId in Login; use hashed_password for technicians; remove demo auto-login in production builds
- Remove org auto-create on page load; move org creation behind admin-only UI or Super Admin

## Reporting & Export
- Prebuilt queries for:
  - Asset counts by status/category/location
  - Transactions over time (check-in/out)
  - Maintenance jobs out-of-date, due soon, completed
- Export buttons to download CSV/JSON; server-side scheduled exports optional later

## NFC Read/Write
- Payload spec: { org_id, asset_id, asset_tag, checksum, last_written_at }
- Read: Web NFC where supported; fallback manual entry
- Write: Admin-only; verify org, asset ownership; record audit entry
- Error handling: clear toasts for unsupported browsers and failures

## Vercel Deployment
- Two projects:
  - Admin/Technician app (repo root) with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  - Super Admin app (super-admin dir) with same env vars
- Update vercel.json rewrite to exclude /api; implement /api/send-email or remove client calls
- Replace process.env usage in browser with import.meta.env

## Step-by-Step Implementation
1. Schema stabilization
   - Drop legacy tables (assets_v2, transactions_v2, feature_flags, flags, tickets, requests) and fix FKs
   - Add indexes on org_id, technician_id, created_at for jobs/transactions
2. Code cleanup
   - Remove tickets/flags pages and nav; remove feature-toggle code paths
   - Consolidate supabase queries to canonical tables; fix remaining references
   - Add RequireTechnician guard; fix ProtectedRoute or remove it
   - Remove org auto-create from AppLayout; move to Super Admin or admin-only action
3. Maintenance workflows
   - Jobs CRUD UI; status transitions; next service date; checklist
   - Technician task views; completion logging to activities
4. NFC management
   - Implement write flow with payload spec and audits; ensure read selects asset by tag
   - UX for unsupported browsers; permissions prompts
5. Reporting & exports
   - Build dashboards for counts and trends; add CSV export buttons on assets, transactions, jobs
6. Offline-first technician
   - Local queue for transactions/jobs; sync and conflict resolution
7. Deployment hardening
   - Vercel rewrite fix; add /api/send-email serverless function or remove usage
   - Ensure envs configured in both projects; verify builds and routes

## Validation Plan
- Admin: create asset → bind NFC tag → check out/in → see transaction appear → export transactions CSV
- Technician: login → view job → scan NFC to fetch asset → complete maintenance → works offline then sync
- Super Admin: create org → brand setting displays in admin app; no flags/tickets

## Deliverables
- Migration scripts to remove legacy tables and fix FKs
- Updated pages/components without tickets/flags; only Admin and Technician roles
- NFC payload spec and implementation
- Reporting views and CSV export utilities
- Deployment config updates for Vercel

## Risks & Mitigations
- Data loss when dropping legacy tables → take backup and write migration that copies v2 data into canonical tables first
- Browser NFC support limited → graceful fallback and manual flows
- Offline sync conflicts → last-write-wins with audit trail for corrections

Please confirm, and I’ll begin implementing these changes sequentially with verification at each step.