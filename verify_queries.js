const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        // 1. /api/machines
        console.log('Testing /api/machines...');
        await pool.query(`
      SELECT machine
      FROM machines
      WHERE COALESCE(is_active, TRUE) = TRUE
      AND ($1::text IS NULL OR line = $1 OR machine LIKE $1 || '%')
      ORDER BY machine
    `, ['B -L1']);
        console.log('...OK');

        // 2. /api/queue
        console.log('Testing /api/queue...');
        await pool.query(`
      SELECT 
        plan_id as id, 
        order_no, 
        machine, 
        item_name as product_name, 
        plan_qty, 
        status, 
        seq as priority, 
        start_date, 
        start_date as plan_date,
        CASE WHEN status = 'Running' THEN 1 ELSE 2 END as sort_order
      FROM plan_board
      WHERE machine LIKE $1 || '%'
      AND status IN ('Running', 'Planned')
      ORDER BY sort_order ASC, seq ASC, updated_at ASC
    `, ['B -L1']);
        console.log('...OK');

        // 3. /api/std-actual/status
        console.log('Testing /api/std-actual/status...');
        // We need a valid plan_id. Let's fetch one from plan_board first.
        const plans = await pool.query('SELECT plan_id FROM plan_board LIMIT 1');
        const pid = plans.rows.length ? plans.rows[0].plan_id : 'dummy';

        await pool.query(`
      SELECT status FROM plan_board WHERE plan_id = $1
    `, [pid]);
        console.log('...OK');

        // 4. /api/dpr/recent
        console.log('Testing /api/dpr/recent...');
        await pool.query(`
       SELECT
         id AS "UniqueID",
         dpr_date     AS "Date",
         hour_slot    AS "HourSlot",
         shots        AS "Shots",
         reject_qty   AS "RejectQty",
         downtime_min AS "DowntimeMin",
         remarks      AS "Remarks"
       FROM dpr_hourly
       WHERE line = $1 AND machine = $2
       ORDER BY dpr_date DESC, created_at DESC
       LIMIT $3
    `, ['B -L1', 'dummy-machine', 10]);
        console.log('...OK');

        pool.end();
    } catch (e) {
        console.error('FAIL:', e.message);
        pool.end();
    }
}
run();
