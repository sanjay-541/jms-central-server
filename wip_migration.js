
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function runMigration() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Starting Migration...');

        // 1. Modify shifting_records
        console.log('1. Adding status columns to shifting_records...');
        // Check if column exists to avoid errors on re-run
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shifting_records' AND column_name='status') THEN
                    ALTER TABLE shifting_records ADD COLUMN status VARCHAR(20) DEFAULT 'Pending';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shifting_records' AND column_name='approved_by') THEN
                    ALTER TABLE shifting_records ADD COLUMN approved_by VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shifting_records' AND column_name='approved_at') THEN
                    ALTER TABLE shifting_records ADD COLUMN approved_at TIMESTAMP;
                END IF;
            END $$;
        `);

        // 2. Create wip_inventory
        console.log('2. Creating wip_inventory table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS wip_inventory (
                id SERIAL PRIMARY KEY,
                shifting_record_id INT REFERENCES shifting_records(id),
                order_no TEXT,
                item_code TEXT,
                item_name TEXT,
                mould_name TEXT,
                rack_no TEXT,
                qty INT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 3. Create wip_outward_logs
        console.log('3. Creating wip_outward_logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS wip_outward_logs (
                id SERIAL PRIMARY KEY,
                wip_inventory_id INT REFERENCES wip_inventory(id),
                qty INT,
                to_location TEXT,
                receiver_name TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query('COMMIT');
        console.log('Migration Successful!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
