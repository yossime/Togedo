# Togedo

Collaborative group task management. Create a group, invite up to 15 people, and work through tasks together with a claim workflow (`OPEN → CLAIMED → IN_PROGRESS → DONE`), member/manager roles, and real-time updates over WebSocket.

## Features

- **Groups** — create groups of up to 15 members; the creator becomes the group manager
- **Invites** — managers invite members by email; invites are single-use, cryptographically random tokens that expire after 7 days
- **Tasks** — anyone in the group can open a task; members claim tasks and move them through the status workflow
- **Roles** — task editing/deleting is restricted to the task creator or a group manager, enforced in the service layer
- **Real-time** — task changes are pushed to group members via Socket.IO; notifications are persisted per user
- **Auth** — email/password (bcrypt) and Google OAuth via NextAuth, backed by a NestJS-issued JWT for API and WebSocket auth

## Architecture

pnpm monorepo with two workspaces sharing one type graph:

```
togedo/
├── frontend/            # Next.js 15 (App Router) + React 19 + Tailwind
│   ├── app/             # Pages: auth, dashboard, groups, tasks
│   └── lib/trpc.ts      # tRPC client — imports the router *type* from the backend
│
├── backend/             # NestJS 10
│   └── src/
│       ├── auth/        # NextAuth-compatible JWT + Google strategies
│       ├── groups/      # Group / membership / invite domain logic
│       ├── tasks/       # Task domain logic + authorization rules
│       ├── trpc/        # tRPC routers, context created inside Nest DI
│       ├── websocket/   # Socket.IO gateway (JWT-authenticated)
│       └── prisma/      # Prisma 6 schema (PostgreSQL), split per model
│
└── docker-compose.yml   # Local PostgreSQL
```

Design decisions worth noting:

- **End-to-end types without code sharing** — the frontend imports only the *type* of the backend's tRPC router, so API inputs/outputs (including `Date` fields, via superjson) are fully typed across the wire with zero codegen.
- **Authorization in the service layer** — every service method takes the acting `userId` and checks membership/role against the database, so the rules hold no matter which transport (tRPC, REST controller) calls it. This is what the unit tests cover.
- **tRPC inside Nest DI** — the tRPC context is created by an injectable service, so procedures use the same singleton Prisma client and services as the rest of the app.
- **Fail-fast configuration** — the server refuses to boot without `JWT_SECRET`; there are no fallback secrets.

## Getting started

Prerequisites: Node 18+, pnpm 8+, Docker (or your own PostgreSQL 14+).

```bash
git clone https://github.com/yossime/Togedo.git
cd Togedo
pnpm install

# 1. Environment — generates frontend/.env.local and backend/.env with random secrets
node setup-env.js

# 2. Database
docker compose up -d
cd backend
pnpm prisma:generate
npx prisma migrate dev
cd ..

# 3. Run both apps (frontend :3000, backend :4000)
pnpm dev
```

Open http://localhost:3000, register an account, create a group, and start adding tasks. The backend's Swagger docs are at http://localhost:4000/api/docs.

> Google sign-in is optional; to enable it, fill in the `GOOGLE_*` variables in both `.env` files with credentials from the Google Cloud Console.

## Scripts

| Command | Where | What |
| --- | --- | --- |
| `pnpm dev` | root | Run frontend + backend in watch mode |
| `pnpm build` | root | Production build of both workspaces |
| `pnpm lint` | root | ESLint on both workspaces |
| `pnpm --filter togedo-backend test` | root | Backend unit tests (Jest) |
| `pnpm --filter togedo-backend typecheck` | root | Backend `tsc --noEmit` |
| `pnpm --filter togedo-frontend typecheck` | root | Frontend `tsc --noEmit` |

## Testing

Unit tests focus on the code that must not regress: the authorization rules in `tasks.service.ts` (who may update/delete/see tasks) and the group invite flow in `groups.service.ts` (manager-only invites, member limit, token randomness/expiry, single-use acceptance). Prisma and the WebSocket gateway are mocked.

```bash
pnpm --filter togedo-backend test
```

CI (GitHub Actions) runs lint, typecheck for both workspaces, the test suite, and full builds on every push.

## Development notes

This project was built with significant help from AI coding tools; the architecture, code review, and final decisions are my own. It is a portfolio project — not hardened for production use.

## License

[MIT](LICENSE)
