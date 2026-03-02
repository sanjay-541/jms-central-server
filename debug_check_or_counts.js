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
      SELECT or_jr_no, COUNT(*) 
      FROM or_jr_report 
      GROUP BY or_jr_no 
      HAVING COUNT(*) > 1 
      LIMIT 10
    `);
        console.log('ORs with >1 row:', res.rows.length);
        if (res.rows.length) {
            const orNo = res.rows[0].or_jr_no;
            const details = await client.query(`SELECT or_jr_no, plan_date, job_card_no FROM or_jr_report WHERE or_jr_no = $1`, [orNo]);
            console.log(`Details for ${orNo}:`, JSON.stringify(details.rows, null, 2));
        }
    } catch (e) {
        console.log(e);
    } finally {
        client.release();
    }
})();
