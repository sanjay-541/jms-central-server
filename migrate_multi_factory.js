require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms',
    port: process.env.PGPORT || 5432
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting Multi-Factory Migration...');
        await client.query('BEGIN');

        // 0. FIX USERS TABLE (Missing ID column)
        // Check if ID exists
        const userCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id'
        `);

        if (userCheck.rows.length === 0) {
            console.log('Fixing Users Table: Adding ID column...');
            await client.query(`ALTER TABLE users ADD COLUMN id SERIAL`);
            // We keep username as PK for now or switch? 
            // The code expects ID to be PK in some places, so let's switch PK to ID.

            // Drop old PK (username)
            await client.query(`ALTER TABLE users DROP CONSTRAINT users_pkey CASCADE`);

            // Make ID new PK
            await client.query(`ALTER TABLE users ADD PRIMARY KEY (id)`);

            // Make username Unique
            await client.query(`ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username)`);

            console.log('Users table normalized (ID is now PK).');
        }

        // 1. Create Factories Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS factories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT UNIQUE NOT NULL,
                location TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Created factories table.');

        // 2. Insert Default Factory (ID 1)
        // User requested: "Dungra Plant 1"
        const factoryRes = await client.query(`
            INSERT INTO factories (name, code, location)
            VALUES ('Dungra Plant 1', 'DUNGRA_1', 'Dungra, India')
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        `);
        const factoryId = factoryRes.rows[0].id; // Should be 1
        console.log(`Ensured Default Factory: Dungra Plant 1 (ID: ${factoryId})`);

        // 3. Create User-Factories Table (Many-to-Many)
        // Now users(id) definitely exists.
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_factories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                factory_id INTEGER REFERENCES factories(id) ON DELETE CASCADE,
                role_code TEXT, -- Override role per factory if needed
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, factory_id)
            );
        `);
        console.log('Created user_factories table.');

        // 4. Assign ALL existing users to this default factory
        await client.query(`
            INSERT INTO user_factories (user_id, factory_id)
            SELECT id, $1 FROM users
            ON CONFLICT (user_id, factory_id) DO NOTHING;
        `, [factoryId]);
        console.log(`Assigned all users to Factory ${factoryId}.`);


        // 5. List of Tables to Scope by Factory
        const tables = [
            'machines',
            'moulds',
            'plan_board',
            'std_actual',
            'dpr_hourly', // Assuming this exists or is created
            'qc_online_reports',
            'qc_issue_memos',
            'qc_training_sheets',
            'qc_deviations',
            'shifting_records',
            'machine_status_logs',
            'operator_history',
            'planning_drops',
            'assembly_plans',
            'shift_teams',
            'or_jr_report',
            'mould_planning_summary',
            'jc_details',
            'jc_summaries',
            'wip_inventory',
            'wip_logs',
            'orders'
        ];

        // 5.1 Check which tables actually exist to avoid errors
        const resTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        const existingTables = resTables.rows.map(r => r.table_name);

        for (const table of tables) {
            if (existingTables.includes(table)) {

                // Add Column
                await client.query(`
                    ALTER TABLE ${table} 
                    ADD COLUMN IF NOT EXISTS factory_id INTEGER REFERENCES factories(id) ON DELETE SET DEFAULT DEFAULT ${factoryId};
                `);
                // Note: SET DEFAULT ensures future rows get ID 1 unless specified.

                // Backfill NULLs 
                await client.query(`
                    UPDATE ${table} SET factory_id = ${factoryId} WHERE factory_id IS NULL;
                `);

                // Index
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_${table}_factory 
                    ON ${table}(factory_id);
                `);
                console.log(`Migrated table: ${table}`);
            }
        }

        await client.query('COMMIT');
        console.log('Migration Complete Successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
