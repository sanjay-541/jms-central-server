const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'jpsms',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    port: process.env.PGPORT || 5432,
});

async function check() {
    try {
        const client = await pool.connect();

        console.log('--- Orders (top 5) ---');
        const resOrders = await client.query('SELECT order_no FROM orders LIMIT 5');
        console.table(resOrders.rows);

        console.log('--- Mould Planning Summary (top 5) ---');
        const resSummary = await client.query('SELECT or_jr_no, mould_name FROM mould_planning_summary LIMIT 5');
        console.table(resSummary.rows);

        // Check for ANY match
        console.log('--- Checking for overlap ---');
        const resMatch = await client.query(`
        SELECT count(*) as matches 
        FROM orders o
        JOIN mould_planning_summary s ON s.or_jr_no = o.order_no
    `);
        console.log('Total Matching Records (Exact Match):', resMatch.rows[0].matches);

        // Check for fuzzy match (trim)
        const resMatchTrim = await client.query(`
        SELECT count(*) as matches 
        FROM orders o
        JOIN mould_planning_summary s ON TRIM(s.or_jr_no) = TRIM(o.order_no)
    `);
        console.log('Total Matching Records (Trim Match):', resMatchTrim.rows[0].matches);

        // Check total records
        const c1 = await client.query('SELECT count(*) FROM orders');
        const c2 = await client.query('SELECT count(*) FROM mould_planning_summary');
        console.log(`Summary: Orders=${c1.rows[0].count}, MouldSummary=${c2.rows[0].count}`);

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
