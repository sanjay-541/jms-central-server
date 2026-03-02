
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function removeUnassigned() {
    console.log('Removing plans not assigned to any machine...');

    try {
        // 1. Count them first
        const countRes = await pool.query(`
        SELECT COUNT(*) 
        FROM plan_board 
        WHERE machine IS NULL OR machine = ''
    `);
        const count = countRes.rows[0].count;
        console.log(`Found ${count} unassigned plans.`);

        if (parseInt(count) > 0) {
            // 2. Delete them
            const deleteRes = await pool.query(`
            DELETE FROM plan_board 
            WHERE machine IS NULL OR machine = ''
        `);
            console.log(`Successfully deleted ${deleteRes.rowCount} unassigned plans.`);
        } else {
            console.log('No unassigned plans found to delete.');
        }

    } catch (e) {
        console.error('Error removing unassigned plans:', e);
    } finally {
        pool.end();
    }
}

removeUnassigned();
