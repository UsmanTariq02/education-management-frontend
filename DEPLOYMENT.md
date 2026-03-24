# Frontend Deployment Guide

This frontend is intended to be deployed to Vercel.

## Target Platform

- application hosting: Vercel
- backend API: Railway-hosted NestJS backend

## Environment Variables

Set these in Vercel:

```env
NEXT_PUBLIC_APP_NAME=EduFlow SaaS
NEXT_PUBLIC_API_BASE_URL=https://your-backend.up.railway.app/v1
```

## Vercel Settings

Framework preset:

- `Next.js`

Install command:

```bash
npm install
```

Build command:

```bash
npm run build
```

## Domain And API Wiring

The frontend expects the backend base URL to point to the Railway deployment and include `/v1`.

Example:

```env
NEXT_PUBLIC_API_BASE_URL=https://education-management-backend.up.railway.app/v1
```

Do not use `/api/v1` here. This backend serves routes under `/v1`.

## Post-Deploy Validation

After Vercel deployment:

1. open the landing page
2. verify login works
3. verify authenticated API calls succeed
4. verify charts load on dashboard and reports
5. verify contact form submits to the backend

## Notes

- if the backend domain changes, update `NEXT_PUBLIC_API_BASE_URL` and redeploy
- if login/refresh fails in production, verify the backend `CORS_ORIGIN` includes the Vercel domain
