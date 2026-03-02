
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkBuilding() {
    const res = await pool.query('SELECT building, COUNT(*) FROM plan_board GROUP BY building');
    console.log('Building Distribution:');
    res.rows.forEach(r => console.log(`  ${r.building}: ${r.count}`));
    pool.end();
}

checkBuilding();
