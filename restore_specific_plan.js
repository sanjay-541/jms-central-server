
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function restoreSpecific() {
    const orderNo = 'JR/JG/2526/4620';
    const machine = 'B -L1>HYD-350-1'; // User specified

    console.log(`Restoring ${orderNo} on ${machine}...`);

    try {
        // 1. Get Details from OR-JR
        const res = await pool.query('SELECT * FROM or_jr_report WHERE or_jr_no = $1', [orderNo]);

        if (res.rows.length === 0) {
            console.error('Order not found in OR-JR Report!');
            return;
        }

        const d = res.rows[0];
        console.log('Found Order Details:', d.product_name, d.item_code, d.jr_qty);

        // 2. Determine details
        // Need to parse machine for Line/Building?
        // Machine format: "B -L1>HYD-350-1"
        // Building: B
        // Line: L1
        let building = 'B';
        let line = '1';

        if (machine.includes('-L')) {
            const parts = machine.split('-L');
            building = parts[0].trim(); // "B "
            const rest = parts[1]; // "1>HYD..."
            line = rest.split('>')[0].trim();
        }

        // 3. Logic check: Was it running?
        // Check DPR
        const dpr = await pool.query('SELECT * FROM dpr_hourly WHERE order_no = $1 ORDER BY created_at DESC LIMIT 1', [orderNo]);
        let status = 'PLANNED';
        let planId = `PLN-${Date.now()}`; // Generate new ID

        if (dpr.rows.length > 0) {
            console.log('Found previous DPR history. Marking as RUNNING.');
            status = 'RUNNING';
            // We could reuse plan_id if we want, but user said "Restore Plan Of this", implies current one is gone.
            // If we reuse plan_id, might link back to old DPRs. Good idea.
            planId = dpr.rows[0].plan_id;
            console.log(`Linking to old Plan ID: ${planId}`);
        }

        // 4. Insert
        // Check if valid mould name
        let mouldName = d.product_name; // Fallback
        // Try to get specific mould name from moulds table if needed, but report product_name is usually mould name.

        // Check if it exists in plan_board first
        const existing = await pool.query('SELECT id FROM plan_board WHERE plan_id = $1', [planId]);

        if (existing.rows.length > 0) {
            console.log(`Plan already exists (ID: ${existing.rows[0].id}). Updating...`);
            await pool.query(`
            UPDATE plan_board 
            SET machine = $1, line = $2, plant = $3, building = $4, status = $5, updated_at = NOW()
            WHERE plan_id = $6
        `, [machine, line, 'DUNGRA', building, status, planId]);
            console.log('Successfully updated existing plan.');
        } else {
            const insert = await pool.query(`
            INSERT INTO plan_board (
                plan_id, machine, line, order_no,
                item_code, item_name, mould_name,
                plan_qty, bal_qty,
                start_date, status, updated_at,
                plant, building
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7,
                $8, $8,
                NOW(), $9, NOW(),
                'DUNGRA', $10
            ) RETURNING id
        `, [
                planId, machine, line, orderNo,
                d.item_code, d.product_name, mouldName,
                d.jr_qty, // Plan Qty
                status,
                building
            ]);
            console.log(`Successfully restored plan. ID: ${insert.rows[0].id}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

restoreSpecific();
