// create_bom_master.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function run() {
    try {
        console.log('Creating bom_master table...');

        // Use a single query for creating the table to ensure it exists before indexes
        await pool.query(`DROP TABLE IF EXISTS bom_master CASCADE;`);
        await pool.query(`
            CREATE TABLE bom_master (
                id SERIAL PRIMARY KEY,
                item_id TEXT,
                bom_item_type TEXT,
                bom_item_code TEXT,
                bom_item_name TEXT,
                bom_item_weight_kgs NUMERIC,
                bom_uom TEXT,
                bom_type TEXT,
                bom_quantity NUMERIC,
                rm_item_type TEXT,
                rm_item_code TEXT,
                rm_item_name_process TEXT,
                rm_sr_no TEXT,
                rm_item_weight_kgs NUMERIC,
                rm_item_uom TEXT,
                rm_item_quantity NUMERIC,
                has_bom TEXT,
                grinding_item_code TEXT,
                grinding_item_name TEXT,
                grinding_percentage NUMERIC,
                alt_items TEXT,
                factory_id INTEGER,
                sync_id UUID DEFAULT gen_random_uuid(),
                sync_status TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_bom_master_sync_id ON bom_master(sync_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_bom_item_code ON bom_master(bom_item_code);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_rm_item_code ON bom_master(rm_item_code);`);
        console.log('Success! Table bom_master created with indexes.');
    } catch (e) {
        console.error('Error creating table:', e);
    } finally {
        pool.end();
    }
}

run();
