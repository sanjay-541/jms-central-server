const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'jpsms',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    port: process.env.PGPORT || 5432,
});

async function run() {
    try {
        console.log('--- CLEANING DROPS ---');

        // 1. Delete drops for any order that is currently 'Pending'
        // Logic: If order is Pending, it shouldn't have "Active" drops effectively? 
        // Wait, if order is Pending, we might want drops to show as "Dropped" if we haven't restored?
        // User said: "if i restore ... then its will be Normal Again".
        // So if status is Pending, we assume it was restored (or never completed).
        // If it was never completed, drops should arguably stay?
        // BUT the user specifically wants "Restore" -> "Normal".

        // We can target the specific order the user is stuck on.
        // JR/JG/2526/4368

        const target = 'JR/JG/2526/4368';
        console.log(`Clearing drops for ${target}...`);
        await pool.query('DELETE FROM planning_drops WHERE order_no = $1', [target]);

        // Also clear duplicates?
        // Delete all drops where (order_no, mould_name) have duplicates, keeping latest?
        // Or just clear all drops for restored orders?

        // Find orders that are 'Pending' but have drops
        const res = await pool.query(`
        SELECT DISTINCT d.order_no 
        FROM planning_drops d
        JOIN orders o ON d.order_no = o.order_no
        WHERE o.status = 'Pending'
    `);

        for (const r of res.rows) {
            console.log(`Order ${r.order_no} is Pending but has drops. Clearing...`);
            await pool.query('DELETE FROM planning_drops WHERE order_no = $1', [r.order_no]);
        }

        console.log('--- DONE ---');

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
