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
        const resMld = await pool.query('SELECT DISTINCT mld_status FROM or_jr_report');
        console.log('--- DISTINCT MLD STATUS ---');
        resMld.rows.forEach(r => console.log(`'${r.mld_status}'`));

        const resJr = await pool.query('SELECT DISTINCT jr_close FROM or_jr_report');
        console.log('\n--- DISTINCT JR CLOSE ---');
        resJr.rows.forEach(r => console.log(`'${r.jr_close}'`));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
