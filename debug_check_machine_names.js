const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    try {
        const id = 62492;
        console.log(`--- Comparing Machine Name for DPR ID: ${id} ---`);

        // Get DPR Machine Name
        const dprRes = await pool.query('SELECT machine FROM dpr_hourly WHERE id = $1', [id]);
        if (dprRes.rowCount === 0) return console.log('Record not found');
        const dprName = dprRes.rows[0].machine;

        // Get Master Machine Name
        const masterRes = await pool.query('SELECT machine FROM machines WHERE machine = $1', [dprName]);

        console.log(`DPR Name: '${dprName}' (Length: ${dprName.length})`);

        if (masterRes.rowCount === 0) {
            console.log('❌ NO EXACT MATCH FOUND IN MACHINES TABLE');

            // Try fuzzy search to see what is close
            const closeRes = await pool.query("SELECT machine FROM machines WHERE machine LIKE 'B -L3>AKAR-125-2%'");
            if (closeRes.rowCount > 0) {
                const masterName = closeRes.rows[0].machine;
                console.log(`Closest Master: '${masterName}' (Length: ${masterName.length})`);

                // Compare Codes
                console.log('\nChar Comparison:');
                const len = Math.max(dprName.length, masterName.length);
                for (let i = 0; i < len; i++) {
                    const c1 = dprName.charCodeAt(i);
                    const c2 = masterName.charCodeAt(i);
                    if (c1 !== c2) {
                        console.log(`Index ${i}: DPR=${c1} ('${dprName[i]}') | Master=${c2} ('${masterName[i]}') <--- DIFF`);
                    }
                }
            }
        } else {
            console.log('✅ Exact match found in Machines table.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
