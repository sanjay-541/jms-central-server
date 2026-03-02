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
        // Check for pairs that differ only by case or whitespace
        const sql = `
      SELECT 
        LOWER(TRIM(or_jr_no)) as or_key, 
        plan_date,
        LOWER(TRIM(job_card_no)) as jc_key,
        COUNT(*),
        json_agg(or_jr_no) as variants
      FROM or_jr_report
      GROUP BY 1, 2, 3
      HAVING COUNT(*) > 1
    `;
        const res = await client.query(sql);
        console.log('Potential Duplicates found:', res.rows.length);
        if (res.rows.length > 0) {
            console.log(JSON.stringify(res.rows.slice(0, 5), null, 2));
        }
    } catch (e) {
        console.log(e);
    } finally {
        client.release();
    }
})();
