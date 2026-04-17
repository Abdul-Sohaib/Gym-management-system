# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Two main artifacts: an Express/MongoDB API server and an Expo React Native mobile app (Gym CRM).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: MongoDB + Mongoose (requires MONGODB_URI env var)
- **Validation**: Zod (`zod/v4`)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo Router (file-based routing), React Native

## Artifacts

### `artifacts/api-server` — Backend API
- Express + MongoDB/Mongoose
- JWT auth (access + refresh tokens, 15m / 7d expiry)
- Nodemailer email (Gmail) for welcome + renewal reminders
- node-cron daily renewal check at 8:00 AM
- Routes: `/api/auth`, `/api/members`, `/api/notifications`, `/api/analytics`, `/api/settings`

### `artifacts/gym-app` — Expo Mobile App
- Dark theme: `#0f0f13` bg, `#6366f1` indigo primary, `#8b5cf6` purple secondary
- Auth screens: login + register
- Tab screens: Dashboard (analytics + charts), Members (CRUD + filters), Notifications, Settings
- Member detail + edit screens
- Cross-platform storage: expo-secure-store on native, localStorage on web
- react-native-gifted-charts for bar charts

## Key Environment Variables
- `MONGODB_URI` — MongoDB connection string (required for database)
- `JWT_SECRET` — JWT access token secret
- `JWT_REFRESH_SECRET` — JWT refresh token secret
- `SESSION_SECRET` — Session secret
- `EMAIL_USER` — Gmail address (can also be set per-gym in admin settings)
- `EMAIL_PASS` — Gmail app password (can also be set per-gym in admin settings)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/gym-app run dev` — run Expo app

## Package Structure

- `lib/api-spec` — OpenAPI spec + codegen config
- `lib/api-client-react` — Generated React Query hooks + Zod schemas
- `artifacts/api-server/src/models` — Mongoose models: Admin, Member, Notification
- `artifacts/api-server/src/routes` — Express route handlers
- `artifacts/api-server/src/services` — emailService, cronService
- `artifacts/api-server/src/middleware` — verifyToken JWT middleware
- `artifacts/gym-app/app` — Expo Router pages
- `artifacts/gym-app/components` — Reusable UI components
- `artifacts/gym-app/context/AuthContext.tsx` — Auth state + token management
- `artifacts/gym-app/services/api.ts` — HTTP client with token refresh
- `artifacts/gym-app/services/secureStorage.ts` — Cross-platform storage (SecureStore/localStorage)
- `artifacts/gym-app/constants/colors.ts` — Dark theme design tokens
