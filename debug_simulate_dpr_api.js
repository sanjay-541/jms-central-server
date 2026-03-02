const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

const naturalCompare = (a, b) => {
    return String(a.machine).localeCompare(String(b.machine), undefined, { numeric: true, sensitivity: 'base' });
};

async function check() {
    try {
        const date = '2026-02-07';
        const shift = 'Day';

        console.log(`--- Simulating /api/dpr/summary-matrix for ${date} (${shift}) ---`);

        // 1. Get All Active Machines
        const machinesRes = await pool.query(`SELECT machine, line, building FROM machines WHERE is_active=true`);
        const machines = machinesRes.rows.sort(naturalCompare);

        // Check if target machine is in list
        const targetMachine = 'B -L3>OM-150-7';
        const foundM = machines.find(m => m.machine === targetMachine);
        if (foundM) {
            console.log(`✅ Machine '${targetMachine}' found in Active List. Line: '${foundM.line}'`);
        } else {
            console.log(`❌ Machine '${targetMachine}' NOT FOUND in Active List!`);
            // Print similar ones
            const similar = machines.filter(m => m.machine.includes('AKAR-125-2'));
            console.log('Similar machines:', similar);
        }

        // 2. Get DPR Entries
        const entriesRes = await pool.query(`
            SELECT 
                d.machine, d.hour_slot, d.good_qty, d.reject_qty, d.downtime_min, 
                d.reject_breakup, d.downtime_breakup, d.colour, d.entry_type,
                d.created_by as user_name, d.created_at,
                u.line as creator_line_access,
                COALESCE(TRIM(d.mould_no), TRIM(pb.item_code), TRIM(mps.mould_no)) as mould_no,
                COALESCE(TRIM(d.order_no), TRIM(pb.order_no), TRIM(mps.or_jr_no)) as order_no,
                TRIM(COALESCE(d.mould_name, pb.mould_name, mps.mould_name)) as mould_name,
                TRIM(COALESCE(d.product_name, pb.item_name)) as product_name
            FROM dpr_hourly d
            LEFT JOIN plan_board pb ON CAST(pb.id AS TEXT) = CAST(d.plan_id AS TEXT)
            LEFT JOIN mould_planning_summary mps ON mps.or_jr_no = d.order_no AND mps.mould_name = pb.mould_name
            LEFT JOIN users u ON u.username = d.created_by
            WHERE d.dpr_date = $1 AND d.shift = $2
        `, [date, shift]);

        console.log(`\nTotal Entries Found: ${entriesRes.rowCount}`);

        // Filter for target entries
        const targetEntries = entriesRes.rows.filter(r => r.machine === targetMachine);
        console.log(`Entries for '${targetMachine}': ${targetEntries.length}`);

        if (targetEntries.length > 0) {
            console.table(targetEntries.map(e => ({
                slot: e.hour_slot,
                mould: e.mould_name,
                order: e.order_no,
                good: e.good_qty
            })));
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
