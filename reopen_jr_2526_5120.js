const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Sanjay@541##',
    database: process.env.DB_NAME || 'jpsms'
});

async function run() {
    const client = await pool.connect();
    try {
        const jr = 'JR/JG/2526/5120';
        console.log(`Reopening ${jr}...`);

        await client.query('BEGIN');

        // 1. Update plan_board
        const resPlan = await client.query(`
        UPDATE plan_board 
        SET status = 'PLANNED', 
            completed_by = NULL, 
            completed_at = NULL,
            updated_at = NOW()
        WHERE order_no = $1
    `, [jr]);
        console.log(`Updated plan_board: ${resPlan.rowCount} rows`);

        // 2. Update or_jr_report
        const resReport = await client.query(`
        UPDATE or_jr_report 
        SET jr_close = 'Open',
            is_closed = false,
            closed_by = NULL,
            closed_at = NULL,
            remarks_all = CONCAT(remarks_all, ' [Reopened by System]')
        WHERE or_jr_no = $1
    `, [jr]);
        console.log(`Updated or_jr_report: ${resReport.rowCount} rows`);

        await client.query('COMMIT');
        console.log('Successfully reopened.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error reopening JR:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
