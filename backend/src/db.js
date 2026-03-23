/**
 * PostgreSQL connection bootstrap shared by the route layer.
 */
const { Pool } = require("pg");

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const sslRaw = (process.env.DB_SSL || "").toLowerCase();

// SSL is enabled if DB_SSL is explicitly set to "true" or "require", or if
// DATABASE_URL is present and DB_SSL has not been set at all. The third branch
// handles deployment on Render and Neon, where DATABASE_URL is provided by the
// platform and SSL is required, but DB_SSL is not always set in the environment.
const sslEnabled =
  sslRaw === "true" ||
  sslRaw === "require" ||
  (sslRaw === "" && hasDatabaseUrl);

// When DATABASE_URL is present, use a single connection string (production on Render/Neon).
// Otherwise fall back to individual host/port/name variables (local development).
const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslEnabled ? { require: true } : false,
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false,
    });

module.exports = { pool };