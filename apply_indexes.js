require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'jpsms',
    password: process.env.DB_PASSWORD || 'Sanjay@541##',
    port: parseInt(process.env.DB_PORT || '5433')
});

async function run() {
    try {
        console.log('Applying optimized indexes...');

        await pool.query('CREATE INDEX IF NOT EXISTS idx_dpr_hourly_date_shift ON dpr_hourly (dpr_date, shift);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_dpr_hourly_machine ON dpr_hourly (machine);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_dpr_hourly_jobcard ON dpr_hourly (jobcard_no);');

        // Also index machine_status_logs
        await pool.query('CREATE INDEX IF NOT EXISTS idx_msl_machine_time ON machine_status_logs (machine, start_date, start_slot);');

        // Optional: Index on orders based on item_code and status
        await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_item_status ON orders (item_code, status);');

        console.log('✅ Indexes applied successfully!');
    } catch (err) {
        console.error('Error applying indexes:', err);
    } finally {
        await pool.end();
    }
}

run();
