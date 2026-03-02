
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkSuffix() {
    console.log('Checking Suffix 488 / 550...');

    try {
        // Get list of orders
        const orders = await pool.query(`
        SELECT or_jr_no FROM or_jr_report 
        WHERE or_jr_no LIKE '%488' OR or_jr_no LIKE '%550'
     `);

        for (const r of orders.rows) {
            const ord = r.or_jr_no;
            // Check Summary Qty
            const sum = await pool.query('SELECT jr_qty, mould_item_qty FROM mould_planning_summary WHERE or_jr_no = $1', [ord]);
            const qty = sum.rows.length ? sum.rows[0].mould_item_qty : 'N/A';
            const jr = sum.rows.length ? sum.rows[0].jr_qty : 'N/A';

            // Check Plan Board Count & Sum
            const pb = await pool.query('SELECT COUNT(*) as cnt, SUM(plan_qty) as total FROM plan_board WHERE order_no = $1', [ord]);
            const pbCnt = pb.rows[0].cnt;
            const pbSum = pb.rows[0].total;

            if (Number(qty) > 10000 || Number(pbSum) > 10000) {
                console.log(`\nFound Suspect: ${ord}`);
                console.log(`  Master Qty: ${qty} (JR: ${jr})`);
                console.log(`  Plan Board: ${pbCnt} rows, Sum: ${pbSum}`);
            }
        }

        console.log('Scan complete.');

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkSuffix();
