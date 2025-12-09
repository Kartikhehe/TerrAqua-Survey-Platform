import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Support for connection string (NeonDB, Heroku, etc.) or individual parameters
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use connection string (for NeonDB and other cloud providers)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for NeonDB and most cloud databases
    }
  };
} else {
  // Use individual parameters (for local development)
  let sslConfig = false;

  if (process.env.DB_SSL === 'true' || process.env.DB_SSL_MODE === 'require') {
    // SSL required (for cloud databases)
    sslConfig = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  } else if (process.env.NODE_ENV === 'production') {
    // Default to SSL in production
    sslConfig = {
      rejectUnauthorized: false
    };
  }

  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'navigation_tracking',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslConfig,
  };
}

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

