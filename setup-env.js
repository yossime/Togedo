const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a random secret key
const generateSecret = () => crypto.randomBytes(32).toString('hex');

// Frontend .env.local file content
const frontendEnvContent = `# NextAuth.js Configuration
NEXTAUTH_URL=http://192.168.1.151:3000
NEXTAUTH_SECRET=${generateSecret()}

# OAuth - Get these from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
`;

// Write frontend .env.local file
const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');
fs.writeFileSync(frontendEnvPath, frontendEnvContent);

console.log('Environment files generated successfully!');
console.log('\nImportant next steps:');
console.log('1. Update the Google OAuth credentials in frontend/.env.local');
console.log('2. Restart your Next.js development server');
console.log('3. Make sure your backend API is running at http://localhost:4000'); 