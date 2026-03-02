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
        const line = 'B -L1';
        console.log(`Checking mismatches for line: '${line}'`);

        // Get Machines from Master
        const mRows = await pool.query(`SELECT DISTINCT machine FROM machines WHERE line = $1 ORDER BY machine`, [line]);
        const masterMachines = mRows.rows.map(r => r.machine);
        console.log("Master Machines (Dropdown):", masterMachines);

        // Get Machines from Plan Board
        const pRows = await pool.query(`SELECT DISTINCT machine FROM plan_board WHERE machine LIKE $1 || '%' ORDER BY machine`, [line]);
        const planMachines = pRows.rows.map(r => r.machine);
        console.log("Plan Board Machines:", planMachines);

        // Find Plans that don't match any Master Machine
        const missing = planMachines.filter(p => !masterMachines.includes(p));
        console.log("Plans with Machine Name NOT in Master:", missing);

        // Find Master Machines that have no plans
        const noPlans = masterMachines.filter(m => !planMachines.includes(m));
        console.log("Master Machines with NO Plans:", noPlans);

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
}
run();
