#!/usr/bin/env node
/**
 * One-time local setup.
 *
 * Writes frontend/.env.local and backend/.env with freshly generated secrets
 * and localhost defaults. Existing files are never overwritten.
 *
 * Usage: node setup-env.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const generateSecret = () => crypto.randomBytes(32).toString('hex');

const files = [
  {
    path: path.join(__dirname, 'frontend', '.env.local'),
    content: `# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateSecret()}

# Google OAuth (optional — email/password auth works without it)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:4000
`,
  },
  {
    path: path.join(__dirname, 'backend', '.env'),
    content: `# PostgreSQL connection string (matches docker-compose.yml defaults)
DATABASE_URL=postgresql://togedo:togedo@localhost:5432/togedo

# JWT signing secret — required, the server refuses to start without it
JWT_SECRET=${generateSecret()}
JWT_EXPIRES_IN=7d

# Server
PORT=4000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Google OAuth (optional — email/password auth works without it)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
`,
  },
];

for (const file of files) {
  const relative = path.relative(__dirname, file.path);
  if (fs.existsSync(file.path)) {
    console.log(`skip   ${relative} (already exists)`);
    continue;
  }
  fs.writeFileSync(file.path, file.content);
  console.log(`wrote  ${relative}`);
}

console.log('\nNext steps:');
console.log('1. docker compose up -d          # start PostgreSQL');
console.log('2. pnpm --filter togedo-backend prisma:generate');
console.log('3. cd backend && npx prisma migrate dev');
console.log('4. pnpm dev                      # frontend :3000, backend :4000');
