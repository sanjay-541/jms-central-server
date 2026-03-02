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
        const machine = 'B -L1>HYD-350-2';
        console.log(`Simulating /api/queue for: ${machine}`);

        // EXACT SQL FROM server.js (Simplified WHERE for specific machine)
        const sql = `
      SELECT 
        pb.plan_id as id, 
        pb.plan_id as "PlanID",
        pb.order_no, 
        pb.order_no as "OrderNo",
        pb.machine, 
        pb.machine as "Machine",
        pb.item_name as product_name, 
        pb.mould_name as "Mould",
        pb.plan_qty, 
        pb.plan_qty as "PlanQty",
        pb.status, 
        pb.status as "Status",
        pb.seq as priority, 
        pb.start_date, 
        pb.start_date as plan_date,
        pb.start_date as "StartDateTime",
        pb.end_date as "CalcEndDateTime",
        
        o.client_name as "Client Name",
        o.item_name as "SFG Name",
        o.item_code as "SFG Code",
        o.priority as "Order Priority",
        o.remarks as "Or Remarks",
        
        pb.item_code as "FG CODE",    
        COALESCE(m.erp_item_code, mps.mould_no) as "Mould No",   
        COALESCE(m.erp_item_code, mps.mould_no) as "Mould Code", 
        
        m.std_wt_kg as "Article STD Weight",
        m.runner_weight as "Runner STD Weight",
        m.no_of_cav as "STD Cavity",
        m.cycle_time as "STD Cycle Time",
        m.pcs_per_hour as "STD PCS/HR",
        m.manpower as "STD Man Power",
        m.material_1 as "Material 1",
        m.material_revised as "Material Revised",
        m.master_batch_1 as "Master Batch 1",
        m.colour_1 as "Colour 1",
        
        COALESCE(mps.mould_item_qty, 0) as "Jc Target Qty", 
        COALESCE(m.std_volume_capacity, '0') as "STD SFG Qty", 
        
        r.job_card_no as "JobCardNo",
        r.job_card_no,

        CONCAT(
           CASE WHEN m.material_1 IS NOT NULL THEN m.material_1 || ' ' ELSE '' END,
           CASE WHEN m.material_revised IS NOT NULL THEN '/ ' || m.material_revised ELSE '' END
        ) as "Mixing Ratio",

        CASE WHEN UPPER(pb.status) = 'RUNNING' THEN 1 ELSE 2 END as sort_order
        
      FROM plan_board pb
      LEFT JOIN orders o ON pb.order_no = o.order_no
      LEFT JOIN moulds m ON m.product_name = pb.mould_name
      LEFT JOIN mould_planning_summary mps ON (mps.or_jr_no = pb.order_no AND mps.mould_name = pb.mould_name)
      LEFT JOIN or_jr_report r ON r.or_jr_no = pb.order_no
      WHERE pb.machine = $1 AND pb.status = 'Running'
    `;

        const res = await client.query(sql, [machine]);
        if (res.rows.length) {
            console.log('Result Row Keys:', Object.keys(res.rows[0]));
            console.log('Article STD Weight:', res.rows[0]['Article STD Weight']);
            console.log('STD SFG Qty:', res.rows[0]['STD SFG Qty']);
            console.log('Full Row:', JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log('No rows returned.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
