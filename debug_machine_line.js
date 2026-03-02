const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    const machine = 'B -L3>AKAR-125-2';
    const res = await pool.query('SELECT machine, line FROM machines WHERE machine = $1', [machine]);
    console.table(res.rows);
    pool.end();
}

check();
