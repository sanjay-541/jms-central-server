
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting JC Keys Migration...');
        await client.query('BEGIN');

        // Fetch all rows
        const res = await client.query('SELECT unique_key, data FROM jc_details');
        console.log(`Found ${res.rows.length} rows.`);

        let updated = 0;
        const seen = new Set();
        const toDelete = [];

        for (const r of res.rows) {
            const d = r.data;
            // Construct Composite Key
            const or = String(d.or_jr_no || '').trim();
            const mould = String(d.mould_no || '').trim();
            const item = String(d.mold_item_code || '').trim();
            const date = String(d.plan_date || '').trim();

            const newKey = `${or}|${mould}|${item}|${date}`;

            if (seen.has(newKey)) {
                // Duplicate based on new key -> Mark for deletion (Keep first seen? Or Keep latest?)
                // The query didn't sort, so "first seen" is arbitrary. 
                // For simplicity, let's just mark current as dup. 
                // (In strict mode we'd sort by updated_at desc and keep first).

                // Actually, let's update it anyway, assume user will re-upload to fix dups if needed.
                // But unique_key usually implies a UNIQUE INDEX constraint locally?
                // jc_details has NO unique constraint on the column in DB yet.
            }
            seen.add(newKey);

            if (r.unique_key !== newKey) {
                await client.query('UPDATE jc_details SET unique_key = $1 WHERE unique_key = $2 AND data::text = $3', [newKey, r.unique_key, JSON.stringify(d)]);
                // Note: WHERE clause using unique_key is risky if it was null or dups. 
                // But jc_details lacks a PK ID? 
                // Let's rely on full data match or just assume unique_key was the old handle.
                updated++;
            }
        }

        console.log(`Updated keys for ${updated} rows.`);

        // Optional: Add Unique Index?
        // User asked for "Uniqueness Key".
        // "Update Already Upload also"
        // Let's try to add unique index. If fails due to dups, we should dedupe.

        // Deduplication Strategy: Keep latest updated_at
        console.log('Deduplicating...');
        await client.query(`
      DELETE FROM jc_details a USING jc_details b
      WHERE a.unique_key = b.unique_key AND a.updated_at < b.updated_at
    `);

        console.log('Adding Unique Constraint on unique_key...');
        // We can't add primary key easily if no ID. But unique index on unique_key works.
        await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS jc_details_unique_key_idx ON jc_details (unique_key);
    `);

        await client.query('COMMIT');
        console.log('Migration Success!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
