const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function checkQueryLogic() {
    await client.connect();

    const orderNo = 'JR/JG/2526/5120';
    console.log(`Checking Query Logic for Order: ${orderNo}`);

    // Simulate the server.js query parts
    const sql = `
        SELECT 
            pb.order_no,
            pb.mould_name,
            m.product_name as mould_master_name,
            m.erp_item_code as mould_master_code,
            mps.mould_no as mps_mould_no,
            COALESCE(mps.mould_no, m.erp_item_code, '-') as computed_mould_no
        FROM plan_board pb
        LEFT JOIN moulds m ON m.product_name = pb.mould_name 
        LEFT JOIN mould_planning_summary mps ON (mps.or_jr_no = pb.order_no AND mps.mould_name = pb.mould_name)
        WHERE pb.order_no = $1
    `;

    const res = await client.query(sql, [orderNo]);
    console.log('Result:', res.rows);

    await client.end();
}

checkQueryLogic().catch(e => console.error(e));
