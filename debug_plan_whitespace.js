
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Checking Plan Board Order No for whitespace...');

        // Fetch questionable order
        const res = await client.query(`
      SELECT id, order_no, length(order_no) as len, length(TRIM(order_no)) as trim_len
      FROM plan_board
      WHERE order_no LIKE '%2526/4620%'
    `);

        console.table(res.rows);

        if (res.rows.length > 0) {
            const o = res.rows[0].order_no;
            console.log(`Raw Value: '${o}'`);
            console.log(`Char Codes: ${o.split('').map(c => c.charCodeAt(0)).join(',')}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
