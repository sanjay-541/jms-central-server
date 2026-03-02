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
        const orNo = 'JR/JG/2526/3971';
        console.log(`Analyzing mld_status for ${orNo}...`);

        const res = await pool.query(`
        SELECT 
            mld_status,
            encode(mld_status::bytea, 'hex') as hex_status
        FROM or_jr_report 
        WHERE or_jr_no = $1
    `, [orNo]);

        console.table(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
