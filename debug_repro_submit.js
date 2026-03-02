const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    try {
        console.log('--- Reproducing Supervisor Save Error ---');

        // Mock Payload mimicking Supervisor.html
        // Case 1: PlanID as String
        const planIdStr = "PLN-1769927400251";
        // Case 2: PlanID as Integer (if applicable)
        const planIdInt = 100;

        console.log(`Testing Query with PlanID: ${planIdStr}`);

        const text = `
            SELECT item_code, mould_name 
            FROM plan_board 
            WHERE CAST(id AS TEXT) = $1 OR CAST(plan_id AS TEXT) = $1
        `;

        // This is the query from server.js lines 1088
        await pool.query(text, [planIdStr]);
        console.log('✅ Query 1 (String PlanID) Success');

        console.log(`Testing Query with Integer ID: ${planIdInt}`);
        // This should FAIL if we don't cast properly in the query itself?
        // Actually the query HAS casts: CAST(id AS TEXT)=$1 
        // So even if $1 is int, it should casting?
        // Wait, if $1 is int, then CAST(id AS TEXT) = $1 means "text = integer".
        // Postgres does NOT have an implicit cast for text = integer.
        // It has integer = integer or text = text.
        // So we MUST cast $1 to text too, or pass it as string.

        await pool.query(text, [planIdInt]);
        console.log('✅ Query 2 (Integer PlanID) Success');

        // Test with Integer?
        // If the error is "operator does not exist: integer = text", it implies
        // a column is integer and we are comparing to text WITHOUT casting, 
        // OR we are passing an integer to a text column?

        // Let's verify the column types of plan_board
        const types = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'plan_board' AND column_name IN ('id', 'plan_id')
        `);
        console.table(types.rows);

    } catch (e) {
        console.error('❌ Error Triggered:', e.message);
    } finally {
        pool.end();
    }
}

check();
