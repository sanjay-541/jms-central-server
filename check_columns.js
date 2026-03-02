const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkColumns() {
    try {
        const client = await pool.connect();

        const tables = ['or_jr_report', 'mould_planning_summary', 'plan_board'];

        for (const table of tables) {
            console.log(`\n--- Columns for ${table} ---`);
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);

            if (res.rows.length === 0) {
                console.log(`Table '${table}' does not exist or has no columns.`);
            } else {
                res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));
            }
        }

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkColumns();
