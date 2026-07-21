const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Success:', res.rows[0]);
  }
  pool.end();
});
