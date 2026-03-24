# Education Management Frontend

Next.js frontend for the Education Management SaaS platform. This application provides the public marketing site, authentication flows, and the protected multi-tenant dashboard used by super admins, organization admins, and staff users.

## Overview

This frontend includes:

- public marketing pages
- authentication flows
- protected dashboard layout
- tenant-aware navigation
- role and permission-aware UI gating
- operational CRUD screens
- analytics and chart-driven reporting
- contact inquiry capture
- student detail dashboard

The application is built to work directly against the NestJS backend in the sibling backend repository.

## Tech Stack

- Next.js App Router
- TypeScript
- React 19
- TanStack React Query
- Axios
- React Hook Form
- Zod
- Recharts
- Tailwind CSS

## Product Surfaces

### Public Pages

- landing page
- about
- pricing
- contact
- login
- forgot password
- reset password
- register

### Dashboard Pages

- overview
- users
- students
- student detail dashboard
- batches
- batch detail
- fee plans
- fees
- attendance
- reminders
- reports
- activity logs
- profile
- settings
- organizations
- roles
- permissions
- inquiries

## Access Model

The frontend reflects the same access model as the backend:

- `SUPER_ADMIN`
  Sees platform modules such as organizations, roles, permissions, and inquiries.
- `ADMIN`
  Operates inside a single organization and can manage tenant settings and operations.
- `STAFF`
  Sees only modules allowed by assigned permissions.

UI behavior:

- sidebar navigation is filtered by role and permission
- mutation controls are hidden or disabled when access is not allowed
- tenant context is shown through organization scope banners
- some screens degrade gracefully when supporting modules are unavailable

## Architecture Summary

The frontend uses a contract-driven feature architecture.

Main layers:

- `app`
  Next.js route groups and page entry points.
- `src/components`
  Shared UI building blocks, layout components, cards, charts, tables, and forms.
- `src/features`
  Feature-scoped API clients and schemas.
- `src/lib`
  API client, constants, auth/session helpers, permissions, formatters, and utilities.
- `src/providers`
  Auth and React Query providers.
- `src/types`
  Shared API/domain/request types aligned to backend DTO contracts.

## Folder Structure

```text
app/
  (public)/
  (dashboard)/
  layout.tsx
  globals.css
src/
  components/
  features/
  hooks/
  lib/
  providers/
  types/
pages/
public/
```

Important note:

- the active Next.js route tree is the root `app/` directory
- `src/app` is not the routed application tree in this repo

## UI And UX Highlights

This frontend includes:

- public marketing pages with richer product messaging
- immediate navigation feedback loader
- chart-driven operations screens
- reusable metric cards
- debounced search across dashboard tables
- filter bars with export support
- tenant-aware settings and organization scope messaging
- detailed student operational dashboard

## API Integration

The frontend talks to the backend through a shared Axios client.

Behavior:

- base URL comes from `NEXT_PUBLIC_API_BASE_URL`
- bearer token is injected automatically
- refresh token flow retries on `401`
- API responses are expected in wrapped backend format
- CRUD contracts align to backend DTO field names

Base URL example:

- local: `http://localhost:3000/v1`
- production: `https://your-backend.up.railway.app/v1`

## Session Handling

Session behavior:

- access and refresh tokens are stored client-side
- session is hydrated through `AuthProvider`
- Axios refreshes tokens when possible
- failed refresh clears the local session

Key files:

- [`client.ts`](/home/usman/Desktop/project/education-management-frontend/src/lib/api/client.ts)
- [`session.ts`](/home/usman/Desktop/project/education-management-frontend/src/lib/auth/session.ts)
- [`auth-provider.tsx`](/home/usman/Desktop/project/education-management-frontend/src/providers/auth-provider.tsx)

## Shared Component Inventory

Layout and navigation:

- `AppSidebar`
- `AppHeader`
- `ProtectedShell`
- `SidebarNav`
- `SiteFooter`

Feedback:

- `LoadingState`
- `ErrorState`
- `EmptyState`
- `NavigationProgress`

Data display:

- `DataTable`
- `MetricCard`
- `ChartCard`
- `Badge`

Forms:

- `FormField`
- `Dialog`
- `Input`
- `Textarea`
- `Select`

Shared dashboard helpers:

- `PageHeader`
- `FilterBar`
- `OrganizationScopeBanner`

## Environment Variables

Copy [`.env.example`](/home/usman/Desktop/project/education-management-frontend/.env.example) to `.env.local`:

```env
NEXT_PUBLIC_APP_NAME="EduFlow SaaS"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/v1"
```

Production example:

```env
NEXT_PUBLIC_APP_NAME="EduFlow SaaS"
NEXT_PUBLIC_API_BASE_URL="https://your-backend.up.railway.app/v1"
```

## Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create env file

```bash
cp .env.example .env.local
```

### 3. Start development server

```bash
npm run dev
```

Frontend runs on:

- `http://localhost:3001` or `http://localhost:3000` depending on your local port usage

Ensure the backend is also running and `NEXT_PUBLIC_API_BASE_URL` points to it.

## Useful Commands

Install:

```bash
npm install
```

Run dev:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run production build locally:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

Typecheck:

```bash
npm run typecheck
```

## Deployment Notes

Recommended deployment:

- frontend on Vercel
- backend on Railway

### Vercel Configuration

Framework:

- `Next.js`

Build command:

```bash
npm run build
```

Install command:

```bash
npm install
```

Required Vercel environment variables:

```env
NEXT_PUBLIC_APP_NAME=EduFlow SaaS
NEXT_PUBLIC_API_BASE_URL=https://your-backend.up.railway.app/v1
```

## Functional Highlights

### Public Site

- stronger About, Pricing, and Contact pages
- pricing aligned to `$1 per module per user`
- contact inquiry submission wired to backend
- footer on public pages

### Dashboard

- tenant-aware operations
- super-admin platform sections
- stat cards on major modules
- chart-ready reports
- student detail operational dashboard
- CSV student import with sample download
- reminder template and automation management
- inquiry review for super admin

## Current Integration Assumptions

This frontend assumes:

- backend versioned API routes live under `/v1`
- backend wraps data in a standard response shape
- backend supports JWT login, refresh, and current-user endpoints
- user payload contains roles, permissions, and organization context

## Operational Notes

- if dashboard pages feel slower in development, compare with `npm run build && npm run start`
- route loading feedback is implemented globally
- searches are debounced to avoid refetching on every keystroke
- some dashboard analytics are fetched from dedicated report endpoints
- student detail dashboard gracefully handles unavailable supporting modules

## Related Repository

This frontend is intended to run with:

- [`education-management-backend`](/home/usman/Desktop/project/education-management-backend)

## License

This project is currently private/internal and has no explicit open-source license declared.
