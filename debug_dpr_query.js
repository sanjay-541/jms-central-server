
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'jpsms',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    port: process.env.PGPORT || 5432,
});

async function run() {
    try {
        const client = await pool.connect();
        console.log('Connected');

        const line = ''; // Simulate empty line
        const machine = 'B -L1>HYD-350-2'; // The machine name
        const limit = 10;

        const sql = `
      SELECT
        id           AS "UniqueID",
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
    `;

        console.log('Running query with:', [line, machine, limit]);

        try {
            const res = await client.query(sql, [line, machine, limit]);
            console.log('Success, rows:', res.rows.length);
        } catch (err) {
            console.error('QUERY FAILED:', err.message);
            console.error('Detail:', err);
        }

        client.release();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
