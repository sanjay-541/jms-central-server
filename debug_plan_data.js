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
        const res = await pool.query(`
      SELECT plan_id, machine, line, status, order_no
      FROM plan_board
      LIMIT 20
    `);
        console.log("Plan Board Rows:");
        console.table(res.rows);

        const count = await pool.query(`SELECT count(*) FROM plan_board`);
        console.log("Total Plans:", count.rows[0].count);

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
}
run();
