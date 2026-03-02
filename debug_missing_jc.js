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
        const orNo = 'JR/JG/2526/4617';
        console.log(`Checking Data for: ${orNo}`);

        // 1. Check Orders Table
        const orderRes = await client.query(`SELECT * FROM orders WHERE order_no = $1`, [orNo]);
        console.log('Orders Table:', orderRes.rows.length ? JSON.stringify(orderRes.rows[0], null, 2) : 'NOT FOUND');

        // 2. Check OR-JR Report Table
        const reportRes = await client.query(`SELECT * FROM or_jr_report WHERE or_jr_no = $1`, [orNo]);
        console.log('OR-JR Report Table:', reportRes.rows.length ? JSON.stringify(reportRes.rows, null, 2) : 'NOT FOUND');

        // 3. Check for whitespace/case issues
        const fuzzyRes = await client.query(`SELECT or_jr_no, job_card_no FROM or_jr_report WHERE TRIM(or_jr_no) ILIKE TRIM($1)`, [orNo]);
        console.log('Fuzzy Match:', fuzzyRes.rows);

    } catch (e) {
        console.log(e);
    } finally {
        client.release();
    }
})();
