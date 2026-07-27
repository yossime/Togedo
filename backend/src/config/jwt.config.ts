import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default_development_secret_key_do_not_use_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
})); 