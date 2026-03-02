
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' }); // Adjust path if needed

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    const ord = 'JR/JG/2526/4395';
    console.log(`Checking for Order No: ${ord}`);

    try {
        // 1. Check mould_planning_summary (Master Plan?)
        const sumRows = await pool.query('SELECT * FROM mould_planning_summary WHERE or_jr_no = $1', [ord]);
        console.log(`[mould_planning_summary] Found ${sumRows.rows.length} rows.`);

        // 2. Check plan_board (Supervisor/Timeline Source)
        const boardRows = await pool.query('SELECT * FROM plan_board WHERE order_no = $1', [ord]);
        console.log(`[plan_board] Found ${boardRows.rows.length} rows.`);
        boardRows.rows.forEach((r, i) => {
            console.log(`  Row ${i + 1}: ID=${r.id}, Status=${r.status}, Machine=${r.machine}, Plant=${r.plant}, Line=${r.line}, Start=${r.start_date}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
