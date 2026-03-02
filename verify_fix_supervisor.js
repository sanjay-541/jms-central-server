const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function verify() {
    try {
        console.log('--- Verifying Supervisor Save Fix ---');

        // Mock integer PlanID which was causing issues when compared to TEXT without cast
        const planIdInt = 100;
        const planIdStr = "PLN-1769927400251";

        const text = `
            SELECT jd.data->>'mould_item_name' 
             FROM plan_board pb 
             JOIN jc_details jd ON jd.data->>'or_jr_no' = pb.order_no 
             -- The Fix: Casting both sides to TEXT
             WHERE (CAST(pb.plan_id AS TEXT) = CAST($1 AS TEXT) OR CAST(pb.id AS TEXT) = CAST($1 AS TEXT))
             LIMIT 1
        `;

        console.log(`Testing Query with Integer ID: ${planIdInt}`);
        await pool.query(text, [planIdInt]);
        console.log('✅ Query (Integer PlanID) Success');

        console.log(`Testing Query with String ID: ${planIdStr}`);
        await pool.query(text, [planIdStr]);
        console.log('✅ Query (String PlanID) Success');

    } catch (e) {
        console.error('❌ Error Triggered:', e.message);
    } finally {
        pool.end();
    }
}

verify();
