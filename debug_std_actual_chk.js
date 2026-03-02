const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        await client.connect();
        const planId = 'PLN-1767422996524';

        console.log(`Checking std_actual for PlanID: ${planId}`);

        const res = await client.query('SELECT * FROM std_actual WHERE plan_id=$1', [planId]);

        if (res.rows.length === 0) {
            console.log('No entry in std_actual. Logic should fetch from moulds.');
        } else {
            console.log('Found entry in std_actual:', res.rows[0]);
            console.log('This entry OVERRIDES the master standard.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
