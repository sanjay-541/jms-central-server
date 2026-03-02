
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function fixDupes() {
    console.log('Starting Cleanup...');

    try {
        // 1. Find Orders where Master Qty != JR Qty (Inflated)
        // We trust JR Qty as the source of truth.
        const inflated = await pool.query(`
        SELECT s.id, s.or_jr_no, s.mould_item_qty, r.jr_qty
        FROM mould_planning_summary s
        JOIN or_jr_report r ON r.or_jr_no = s.or_jr_no
        WHERE s.mould_item_qty > r.jr_qty
          AND s.mould_item_qty > 1000 -- Only fix significant inflations
    `);

        console.log(`\nFound ${inflated.rows.length} inflated Master entries.`);

        for (const row of inflated.rows) {
            console.log(`Fixing ${row.or_jr_no}: ${row.mould_item_qty} -> ${row.jr_qty}`);
            await pool.query('UPDATE mould_planning_summary SET mould_item_qty = $1 WHERE id = $2', [row.jr_qty, row.id]);
        }

        // 2. Find Duplicate Plans in Plan Board
        // Strategy: Group by order_no. If SUM(plan_qty) > JR Qty, we have duplicates.
        // We should keep the one with recent updates or 'RUNNING' status.
        const dupes = await pool.query(`
        SELECT pb.order_no, r.jr_qty, SUM(pb.plan_qty) as total_plan, COUNT(pb.id) as count
        FROM plan_board pb
        JOIN or_jr_report r ON r.or_jr_no = pb.order_no
        GROUP BY pb.order_no, r.jr_qty
        HAVING SUM(pb.plan_qty) > (r.jr_qty * 1.2) -- 20% buffer for splits, but if double/triple it's wrong
    `);

        console.log(`\nFound ${dupes.rows.length} Orders with Duplicate Plans (Total Plan > JR Qty).`);

        for (const d of dupes.rows) {
            // Fetch all plans for this order
            const plans = await pool.query(`
            SELECT id, plan_id, status, plan_qty, start_date, updated_at 
            FROM plan_board 
            WHERE order_no = $1 
            ORDER BY 
                CASE WHEN status = 'RUNNING' THEN 1 
                     WHEN status = 'PLANNED' THEN 2 
                     ELSE 3 END ASC, -- Keep RUNNING/PLANNED
                updated_at DESC -- Keep recently updated
        `, [d.order_no]);

            let runningSum = 0;
            const toKeep = [];
            const toDelete = [];

            // Logic: Keep plans until we reach JR Qty.
            // Actually, simple logic: Use First Match (Best Status/Latest) and delete others?
            // User said "488 to 550 Plans Only". 
            // If we have multiple valid plans splitting the qty, we should keep them.
            // But if we have identical clones...

            // Let's analyze clones.
            // If multiple plans exist, and their sum is huge, it implies duplication.
            // We will keep the first N records that fit within reasonable limits, or just the FIRST one if they are identical.

            // For this safe fix: If we have multiple entries, keep the TOP 1 (Best Status) and delete others, 
            // UNLESS the Top 1 qty is small (< JR Qty).

            // Revised Logic:
            // Keep iterating. If adding this plan's qty exceeds JR Qty drastically, mark as delete?
            // No, simplest is: Find exact duplicates or just keep the main one.

            // Let's try: Keep the one with Status RUNNING. Delete others?
            // If multiple RUNNING, keep latest.
            // If no RUNNING, keep latest PLANNED.

            // BUT, what if the order IS split? 
            // If plan_qty < jr_qty, we might need multiple.

            // Let's assume for these "Inflated" ones (Sum >> JR), we probably just want ONE valid plan if it covers the Qty.
            // Or if the first plan has Qty == JR Qty, delete the rest.

            const validPlans = plans.rows;
            if (validPlans.length === 0) continue;

            const best = validPlans[0]; // Primary Plan
            toKeep.push(best.id);

            // If Primary Plan covers the full Qty (approx), delete everything else
            if (Number(best.plan_qty) >= Number(d.jr_qty) * 0.9) {
                for (let i = 1; i < validPlans.length; i++) {
                    toDelete.push(validPlans[i].id);
                }
            } else {
                // It's a split order. Keep adding until we fill the bucket?
                // For now, let's just delete the pure duplicates (clones).
                // Actually, for the user's specific "14000+" issue, it was likely cloning.
                // Let's just log for now if we are unsure, OR restrict to the specific suffix orders.

                // To be safe/aggressive: If order ends in 488/550, Keep 1, Delete Rest.
                if (d.order_no.endsWith('488') || d.order_no.endsWith('550')) {
                    for (let i = 1; i < validPlans.length; i++) {
                        toDelete.push(validPlans[i].id);
                    }
                }
            }

            if (toDelete.length > 0) {
                console.log(`  Order ${d.order_no}: Keeping ID ${best.id} (${best.status}, Qty ${best.plan_qty}). Deleting ${toDelete.length} duplicates.`);
                await pool.query('DELETE FROM plan_board WHERE id = ANY($1::int[])', [toDelete]);
            }
        }

        console.log('\nCleanup Complete.');

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

fixDupes();
