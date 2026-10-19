export function resolveDatabaseUrl(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const connectionString = isProduction
    ? env.DATABASE_URL || env.NEON_DATABASE_URL
    : env.NEON_DATABASE_URL || env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Set DATABASE_URL or NEON_DATABASE_URL to start the platform API.');
  }

  return connectionString;
}
