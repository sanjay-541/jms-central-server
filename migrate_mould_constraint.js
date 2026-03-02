const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Clean up mould_planning_summary
        console.log('Migrating mould_planning_summary...');

        // Fill NULLs
        await client.query(`UPDATE mould_planning_summary SET mould_no = '' WHERE mould_no IS NULL`);

        // Set NOT NULL DEFAULT
        await client.query(`ALTER TABLE mould_planning_summary ALTER COLUMN mould_no SET DEFAULT ''`);
        await client.query(`ALTER TABLE mould_planning_summary ALTER COLUMN mould_no SET NOT NULL`);

        // DEDUPLICATE: Keep row with MAX(id) for each (or_jr_no, mould_no) group
        console.log('Removing duplicates...');
        await client.query(`
            DELETE FROM mould_planning_summary a USING (
                SELECT MIN(id) as min_id, or_jr_no, mould_no 
                FROM mould_planning_summary 
                GROUP BY or_jr_no, mould_no 
                HAVING COUNT(*) > 1
            ) b
            WHERE a.or_jr_no = b.or_jr_no 
              AND a.mould_no = b.mould_no 
              AND a.id <> b.min_id -- Keep Min or Max? Usually Max is latest. Let's keep MAX.
        `);

        // Retry with KEEP MAX logic:
        // DELETE FROM table WHERE id NOT IN (SELECT MAX(id) FROM table GROUP BY or_jr_no, mould_no)
        await client.query(`
            DELETE FROM mould_planning_summary
            WHERE id NOT IN (
                SELECT MAX(id)
                FROM mould_planning_summary
                GROUP BY or_jr_no, mould_no
            )
        `);

        // Add Unique Constraint (Drop if exists first to be idempotent-ish)
        // We try to catch error if it doesn't exist or just use explicit name
        try {
            await client.query(`ALTER TABLE mould_planning_summary DROP CONSTRAINT IF EXISTS mould_summary_uniq_idx`);
        } catch (e) { }

        await client.query(`ALTER TABLE mould_planning_summary ADD CONSTRAINT mould_summary_uniq_idx UNIQUE (or_jr_no, mould_no)`);


        // 2. Clean up mould_planning_report (Detail) - Just in case user uses this too, keeping consistent
        // Detailed report has mould_item_code usually? User mentioned "Summary" specifically.
        // If I change the code shared by both, I must update both schemas OR separate the logic.
        // The Confirm endpoint uses 'tableName' dynamic.
        // "Delete existing records for these orders" -> "Replace".
        // If I change to Upsert, I need unique key on Report too if I use it there.
        // Let's check report columns first.

        const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'mould_planning_report'`);
        const cols = res.rows.map(r => r.column_name);
        console.log('Report Columns:', cols);

        if (cols.length > 0) {
            // It exists. Does it have mould_no?
            if (cols.includes('mould_no')) {
                await client.query(`UPDATE mould_planning_report SET mould_no = '' WHERE mould_no IS NULL`);
                await client.query(`ALTER TABLE mould_planning_report ALTER COLUMN mould_no SET DEFAULT ''`);
                await client.query(`ALTER TABLE mould_planning_report ALTER COLUMN mould_no SET NOT NULL`);

                // UNIQ on Report? Report might have multiple rows per mould_no (items?). 
                // If detail report has multiple items per mould, then (or_jr_no, mould_no) IS NOT UNIQUE.
                // It would be (or_jr_no, mould_no, mould_item_code).
                // User query specifically mentioned "Summary".
            }
        }

        await client.query('COMMIT');
        console.log('Migration successful.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
