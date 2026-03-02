const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: process.env.DB_PORT || process.env.PGPORT || 5432,
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'jpsms'
});

async function run() {
    const client = await pool.connect();
    try {
        console.log("Starting Factory Isolation Migration v2...");

        const tables = ['machines', 'moulds', 'orders', 'mould_planning_report', 'mould_planning_summary', 'plan_board', 'or_jr_report'];

        for (const table of tables) {
            console.log(`Checking ${table}...`);

            // 1. Add factory_id column if missing
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='${table}' AND column_name='factory_id') THEN 
                        ALTER TABLE ${table} ADD COLUMN factory_id INTEGER DEFAULT 1; 
                        RAISE NOTICE 'Added factory_id to ${table}';
                    END IF; 
                END $$;
            `);

            // 2. Create Index
            await client.query(`CREATE INDEX IF NOT EXISTS idx_${table}_factory_id ON ${table}(factory_id)`);
        }

        console.log("Migration Complete.");
    } catch (e) {
        console.error("Migration Failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
