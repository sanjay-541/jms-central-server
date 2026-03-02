const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'jpsms',
    port: process.env.PGPORT || 5432,
    ssl: false
});

(async () => {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT or_jr_no, job_card_no, COUNT(*) 
      FROM or_jr_report 
      GROUP BY or_jr_no, job_card_no 
      HAVING COUNT(*) > 1
    `);
        console.log('Strict Duplicates (Same OR+JC):', res.rows.length);
    } catch (e) {
        console.log(e);
    } finally {
        client.release();
    }
})();
