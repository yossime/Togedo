import { registerAs } from '@nestjs/config';

/**
 * Single source of truth for JWT configuration.
 * The server refuses to start without an explicit JWT_SECRET so it can
 * never silently fall back to a well-known development secret.
 */
export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. See backend/.env.example.',
    );
  }
  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
});
