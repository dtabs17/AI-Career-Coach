const { Pool } = require("pg");

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const sslRaw = (process.env.DB_SSL || "").toLowerCase();
const sslEnabled =
  sslRaw === "true" ||
  sslRaw === "require" ||
  (sslRaw === "" && hasDatabaseUrl);

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