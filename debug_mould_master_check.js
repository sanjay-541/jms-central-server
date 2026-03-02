const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function checkMouldMaster() {
    await client.connect();

    const mouldNames = [
        'SITWELL BIG',
        'Better Home Square Linea Patla (Medium) Btm',
        'OVAL DUAL DUST BIN FRAME',
        'SITWELL SMALL'
    ];

    console.log('Checking Mould Master for:', mouldNames);

    const res = await client.query(`
        SELECT product_name, erp_item_code 
        FROM moulds 
        WHERE product_name = ANY($1)
    `, [mouldNames]);

    console.log('Mould Master Entries:', res.rows);

    await client.end();
}

checkMouldMaster().catch(e => console.error(e));
