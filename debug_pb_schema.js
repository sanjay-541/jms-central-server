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

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'plan_board';
        `);

        console.log('Table: plan_board');
        res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
