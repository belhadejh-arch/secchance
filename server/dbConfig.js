export function resolveDatabaseConfig(env = process.env) {
  if (env.NODE_ENV === 'test' && env.TEST_DATABASE_URL) {
    return { connectionString: env.TEST_DATABASE_URL, source: 'TEST_DATABASE_URL' };
  }
  if (env.NEON_DATABASE_URL) {
    return { connectionString: env.NEON_DATABASE_URL, source: 'NEON_DATABASE_URL' };
  }
  if (env.DATABASE_URL) {
    return { connectionString: env.DATABASE_URL, source: 'DATABASE_URL' };
  }
  if (!env.NEON_DATABASE_URL && !env.DATABASE_URL) {
    throw new Error('Set DATABASE_URL or NEON_DATABASE_URL to start the platform API.');
  }
}
