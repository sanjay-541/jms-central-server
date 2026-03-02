const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function seedRealData() {
    const client = await pool.connect();
    try {
        console.log('Seeding realistic data...');

        // 1. Machines
        // We'll insert a set of realistic machines
        const machines = [];
        const buildings = ['B', 'C', 'E', 'F'];
        for (const b of buildings) {
            const lines = (b === 'E' || b === 'F') ? 8 : 6;
            for (let l = 1; l <= lines; l++) {
                const count = 4; // 4 machines per line
                for (let m = 1; m <= count; m++) {
                    machines.push({
                        code: `${b}${l}-M${m}`,
                        line: `${l}`,
                        building: b
                    });
                }
            }
        }

        console.log(`Preparing ${machines.length} machines...`);
        for (const m of machines) {
            await client.query(`
                INSERT INTO machines (machine, line, building, is_active)
                VALUES ($1, $2, $3, true)
                ON CONFLICT (machine) DO NOTHING
            `, [m.code, m.line, m.building]);
        }
        console.log('Machines seeded.');

        // 2. Orders
        // Clear existing pending orders to avoid clutter? Maybe just add new ones.
        // Let's add 20 random pending orders
        const priorities = ['Urgent', 'High', 'Normal', 'Normal', 'Normal'];
        const items = ['Bottle 500ml', 'Cap 28mm', 'Preform 18g', 'Handle 5L', 'Container 10L'];

        console.log('Seeding orders...');
        for (let i = 1; i <= 20; i++) {
            const ordNo = `ORD-${2024000 + i}`;
            const item = items[Math.floor(Math.random() * items.length)];
            const pri = priorities[Math.floor(Math.random() * priorities.length)];
            const qty = (Math.floor(Math.random() * 10) + 1) * 5000;

            await client.query(`
                INSERT INTO orders (order_no, item_name, qty, priority, status, created_at)
                VALUES ($1, $2, $3, $4, 'Pending', NOW())
                ON CONFLICT (order_no) DO NOTHING
            `, [ordNo, item, qty, pri]);
        }
        console.log('Orders seeded.');

        console.log('Database populated with real data successfully!');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seedRealData();
