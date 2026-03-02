
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkData() {
    const client = await pool.connect();
    try {
        console.log('--- Checking Mould Planning Report ---');
        const countRes = await client.query('SELECT count(*) FROM mould_planning_report');
        console.log('Total Rows in mould_planning_report:', countRes.rows[0].count);

        console.log('\n--- Checking Sample Join (Order Details) ---');
        const sampleOrder = await client.query('SELECT or_jr_no FROM mould_planning_report LIMIT 1');
        if (sampleOrder.rows.length) {
            const orderNo = sampleOrder.rows[0].or_jr_no;
            console.log('Testing Join for Order:', orderNo);

            const joinRes = await client.query(`
                SELECT 
                    r.or_jr_no,
                    r.item_code,
                    m.erp_item_code,
                    r.mould_name,
                    m.machine AS "masterMachine"
                FROM mould_planning_report r
                LEFT JOIN moulds m ON (TRIM(r.item_code) = TRIM(m.erp_item_code))
                WHERE r.or_jr_no = $1
            `, [orderNo]);

            console.log('Rows found:', joinRes.rows.length);
            joinRes.rows.forEach(r => {
                console.log(`[${r.item_code}] -> Master Match: ${r.erp_item_code ? 'YES' : 'NO'} | Tonnage: ${r.masterMachine}`);
            });
        } else {
            console.log('No orders found to test join.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

checkData();
