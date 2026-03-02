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
        console.log('Starting Factory V2 Migration...');
        await client.query('BEGIN');

        // 1. Create Factories Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS factories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT UNIQUE NOT NULL,
                location TEXT,
                api_url TEXT, -- For Main to contact Local (optional) or Local to know its endpoint
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Factories Table: Checked/Created.');

        // 2. Default Factory
        const factoryRes = await client.query(`
            INSERT INTO factories (name, code, location)
            VALUES ('Dungra Plant 1', 'DUNGRA_1', 'Dungra, India')
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        `);
        const factoryId = factoryRes.rows[0].id;
        console.log(`Default Factory ID: ${factoryId}`);

        // 3. Update Users Table (Global Access)
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS global_access BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS id SERIAL; -- Ensure ID exists
        `);
        // Ensure ID is PK if not already (migrated in v1, but good to ensure)
        // Note: Assuming previous migration might have run or not. 

        // 4. User Factories Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_factories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                factory_id INTEGER REFERENCES factories(id) ON DELETE CASCADE,
                role_code TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, factory_id)
            );
        `);
        console.log('User-Factories Table: Checked/Created.');

        // 5. Server Config Table (To identify this server)
        await client.query(`
            CREATE TABLE IF NOT EXISTS server_config (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        // Set default if empty
        await client.query(`
            INSERT INTO server_config (key, value) VALUES ('SERVER_TYPE', 'MAIN') ON CONFLICT DO NOTHING;
        `);
        console.log('Server Config Table: Checked/Created.');

        // 6. Tables to modify with factory_id and sync_id (UUID)
        // sync_id is crucial for identifying records across servers regardless of local SERIAL id
        const transactionalTables = [
            'machines', 'moulds', 'plan_board', 'std_actual', 'dpr_hourly',
            'qc_online_reports', 'qc_issue_memos', 'qc_deviations',
            'shifting_records', 'machine_status_logs', 'operator_history',
            'planning_drops', 'assembly_plans', 'shift_teams',
            'or_jr_report', 'mould_planning_summary', 'date_master',
            'users' // Users also need to be synced!
        ];

        // Ensure uuid-ossp extension
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        for (const table of transactionalTables) {
            // Check existence
            const check = await client.query(`SELECT to_regclass('public.${table}');`);
            if (check.rows[0].to_regclass) {
                // Add factory_id
                await client.query(`
                    ALTER TABLE ${table} 
                    ADD COLUMN IF NOT EXISTS factory_id INTEGER DEFAULT ${factoryId};
                `);

                // Add sync_id (UUID)
                await client.query(`
                    ALTER TABLE ${table} 
                    ADD COLUMN IF NOT EXISTS sync_id UUID DEFAULT uuid_generate_v4();
                `);

                // Index sync_id
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_${table}_sync_id ON ${table}(sync_id);
                `);

                // Index factory_id
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_${table}_factory_id ON ${table}(factory_id);
                `);

                // Ensure uniqueness of sync_id is usually good, but we might have duplicates if data is messy. 
                // Let's enforce unique constraint on sync_id where possible? 
                // Maybe later. For now, just having it is enough.
            }
        }

        // 7. Assign Superadmin to Default Factory
        await client.query(`
            INSERT INTO user_factories (user_id, factory_id, role_code)
            SELECT id, ${factoryId}, 'superadmin' FROM users WHERE username = 'superadmin' OR role_code = 'superadmin'
            ON CONFLICT DO NOTHING;
        `);

        // 8. Grant Global Access to Superadmin
        await client.query(`
             UPDATE users SET global_access = TRUE WHERE role_code = 'superadmin' OR username = 'superadmin';
        `);

        await client.query('COMMIT');
        console.log('Factory V2 Migration Complete!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
