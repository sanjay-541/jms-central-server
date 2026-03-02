
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkOR() {
    const ord = 'JR/JG/2526/4395';
    console.log(`Checking OR-JR Report for: ${ord}`);

    try {
        const res = await pool.query('SELECT * FROM or_jr_report WHERE or_jr_no = $1', [ord]);
        if (res.rows.length === 0) {
            console.log("No OR-JR Report found.");
        } else {
            const r = res.rows[0];
            console.log(`Found OR-JR Report: ID=${r.or_jr_no}`); // PK is text
            console.log(`  jr_qty: ${r.jr_qty}`);
            console.log(`  plan_qty: ${r.plan_qty}`);
            console.log(`  prod_plan_qty: ${r.prod_plan_qty}`);
            console.log(`  or_qty: ${r.or_qty}`);
        }

        console.log('---');
        console.log('Checking mould_planning_summary:');
        const sumRes = await pool.query('SELECT * FROM mould_planning_summary WHERE or_jr_no = $1', [ord]);
        if (sumRes.rows.length === 0) {
            console.log("No Summary found.");
        } else {
            const s = sumRes.rows[0];
            console.log(`Summary ID=${s.id}`);
            console.log(`  jr_qty: ${s.jr_qty}`);
            console.log(`  mould_item_qty: ${s.mould_item_qty}`);
            // Check if there are huge numbers
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkOR();
