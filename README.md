# Togedo - Collaborative Task Management

Togedo is a modern collaborative task management application built with Next.js, NestJS, and Prisma. It allows teams to organize tasks, collaborate in groups, and track progress in real-time.

## Features

- 🔐 Secure authentication with Google OAuth
- 👥 Group management (up to 15 members per group)
- ✅ Task status tracking (OPEN, CLAIMED, IN_PROGRESS, DONE)
- 🔔 Real-time notifications via WebSocket
- 👮‍♂️ Role-based access control (MEMBER, MANAGER)
- 📱 Mobile-first responsive design

## Tech Stack

### Frontend
- Next.js 13+ (App Router)
- React with TypeScript
- Tailwind CSS for styling
- tRPC for type-safe API communication
- Socket.IO client for real-time updates
- NextAuth.js for authentication

### Backend
- NestJS with TypeScript
- Prisma as ORM
- PostgreSQL database
- tRPC for API endpoints
- WebSocket for real-time features
- JWT for API authentication

## Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL 14+

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/togedo.git
   cd togedo
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   # Frontend
   cp frontend/.env.example frontend/.env.local
   # Backend
   cp backend/.env.example backend/.env
   ```

4. Set up the database:
   ```bash
   cd backend
   pnpm prisma migrate dev
   ```

5. Start the development servers:
   ```bash
   # In one terminal
   cd frontend
   pnpm dev

   # In another terminal
   cd backend
   pnpm dev
   ```

6. Open http://localhost:3000 in your browser

## Project Structure

```
togedo/
├── frontend/               # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and configurations
│   └── public/           # Static assets
│
├── backend/               # NestJS backend
│   ├── prisma/           # Database schema and migrations
│   └── src/
│       ├── auth/         # Authentication module
│       ├── groups/       # Groups module
│       ├── tasks/        # Tasks module
│       ├── trpc/         # tRPC setup and routers
│       └── websocket/    # WebSocket gateway
│
└── package.json          # Root package.json for workspaces
```

## Development

- Follow the TypeScript style guide in the codebase
- Use `pnpm` for package management
- Run tests before submitting PRs
- Keep the documentation up to date

## License

MIT 