# Education Management Frontend

## Architecture Overview

This frontend is a Next.js App Router application structured around a contract-driven feature architecture.

- `app`: route groups for public marketing pages and protected dashboard modules
- `src/components`: shared UI, layout, table, chart, feedback, and form building blocks
- `src/features`: feature-scoped API clients, schemas, hooks, and components
- `src/lib`: typed API layer, auth/session helpers, permission utilities, formatters, constants, and validators
- `src/providers`: React Query and auth providers
- `src/types`: shared DTO-aligned request and response types

## Page And Module Breakdown

- Public: landing, pricing, about, contact, login, forgot password, reset password
- Protected: dashboard, users, roles, permissions, students, student detail, batches, batch detail, fees, attendance, reminders, reports, settings, profile
- System: unauthorized, loading, global error, not-found

## API Integration Assumptions

- Backend base URL is exposed via `NEXT_PUBLIC_API_BASE_URL`
- API responses are wrapped as `success`, `message`, `data`, and optional `meta`
- List endpoints use pagination params `page`, `limit`, `search`, `sortBy`, `sortOrder`
- Auth supports JWT access and refresh tokens through `/auth/login`, `/auth/refresh`, and `/auth/me`
- CRUD payloads align with the DTO field names present in `education-management-backend`
- Some analytics are derived client-side from raw records because the current backend report surface is intentionally minimal

## Auth And Permissions Strategy

- Session state is stored in local storage and hydrated through `AuthProvider`
- Axios injects the bearer token automatically
- A refresh-token retry strategy is applied on `401` responses
- Protected routes are guarded with `AuthGuard`
- Sidebar navigation and button visibility are filtered by permissions through centralized permission helpers
- Unauthorized states route to `/unauthorized`

## Reusable Component Inventory

- Layout: `AppSidebar`, `AppHeader`, `ProtectedShell`, `AuthGuard`
- Feedback: `LoadingState`, `ErrorState`, `EmptyState`
- Data display: `DataTable`, `MetricCard`, `ChartCard`, `Badge`
- Forms: `FormField`, shadcn-style `Input`, `Textarea`, `Dialog`, `Select`
- Shared: `PageHeader`, `FilterBar`, `PermissionGate`

## Run

1. Install dependencies
2. Copy `.env.example` to `.env.local`
3. Run `npm run dev`
