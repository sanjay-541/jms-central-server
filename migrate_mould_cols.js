const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        console.log("Adding columns...");
        await pool.query("ALTER TABLE moulds ADD COLUMN IF NOT EXISTS primary_machine TEXT;");
        await pool.query("ALTER TABLE moulds ADD COLUMN IF NOT EXISTS secondary_machine TEXT;");
        console.log("Columns added successfully.");
        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
}
run();
