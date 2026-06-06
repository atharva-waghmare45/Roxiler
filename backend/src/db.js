const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper for running single queries
const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = {
  pool,
  query
};
