# AdminApp / Chowza React Components — Initial Audit

## Scope
Inspected the 40 files in `AdminApp.zip` (React + TypeScript component bundle). The archive does **not** include the full application root, package manifest, TypeScript/Vite configuration, shared context/hooks/types, Supabase client, server/API functions, database migrations/schema, or test suite. Therefore a full build, runtime test, authorization audit, and safe integration cannot yet be completed.

## Confirmed findings

### [IN PROGRESS] Source bundle completeness
- 40 source/backup files were supplied.
- 44 local import references point to files not present in this archive, including `../context/AppContext`, `../lib/supabase`, `../types`, `../hooks/usePWAInstall`, `../hooks/useInactivityLogout`, `../data/mockData`, and `../lib/csrf`.
- `package.json`, lockfile, `tsconfig.json`, Vite configuration, app entry point, and styling/configuration files are absent.
- This is a component bundle, not a runnable application project.

### [PASS] Sensitive browser-console logging reduced
Removed direct `console.log` / `console.error` / `console.warn` calls from:
- `BusinessAuth.tsx`
- `CartBottomSheet.tsx`
- `OrderTracker.tsx`
- `PublicBusinessStore.tsx`
- `AdminApp.tsx`
- `BusinessPortalGate.tsx`
- `PublicCheckout.tsx`
- `BusinessProfileManager.tsx`

Reason: some log statements included user email addresses, auth user IDs, raw Supabase errors, order/payment payloads, and payment redirect data. This information should not be routinely exposed in production browser consoles. User-facing error handling was left intact.

### [NEEDS REVIEW] Component/file naming mismatch
- `TermsAndConditions.tsx` exports a component named `ChowzaHome` and contains restaurant discovery/homepage logic, not terms-and-conditions content.
- `ChowzaHome.tsx` also exports `ChowzaHome`.
- This looks like a likely misnamed or duplicated file, but it was not renamed because the missing app router/import map is needed to avoid breaking navigation.

### [NEEDS CONFIGURATION] Security cannot be fully verified
- Supabase is accessed directly from multiple browser components.
- The archive does not include Supabase client setup, Edge Functions/API code, database policies, or migrations.
- Row Level Security (RLS), admin-role enforcement, business-to-order isolation, storage bucket policies, and payment server-side verification cannot be confirmed from this bundle alone.
- No service-role key was found in the supplied component text. This does not prove that secrets are safe in the omitted project files or deployment settings.

## Checks performed
- Inventory and import-reference scan across all 40 files.
- Search for TODO/FIXME markers and common unsafe DOM patterns.
- TypeScript compiler parse check was attempted with global `tsc`. No TS1xxx syntax diagnostics were reported, but a complete typecheck/build could not run because React, lucide-react, Recharts, and the missing project modules/configuration are absent. The command reported unresolved modules and library-target diagnostics; this is **not** a successful build.

## Outstanding work
1. Obtain the complete Chowza Vite/React project root, not only selected component files.
2. Restore the original folder structure and resolve the 44 missing local imports.
3. Run the real TypeScript check, lint, production build, and app tests.
4. Review Supabase RLS policies and admin/business role boundaries.
5. Verify server-side payment creation, webhook/signature verification, and order state transitions.
6. Test customer checkout, order tracking, business login, business dashboard, admin workflows, menu CRUD, promotions, analytics, and QR flows.
7. Test mobile/tablet/desktop layouts and accessibility.
8. Verify deployment environment and production configuration without changing live settings.

## Safety note
No database, production environment, API keys, or deployment settings were modified. The source changes in this review are limited to removing sensitive diagnostic console output.
