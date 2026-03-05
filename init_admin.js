const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:SecureJPSMS_ProdDB_2026!@postgres:5432/jpsms'
});

async function initAdmin() {
    const client = await pool.connect();
    try {
        console.log('Initializing secure Superadmin account...');
        const username = 'superadmin';
        const rawPass = 'SM_2025';
        const hash = await bcrypt.hash(rawPass, 10);

        // 1. Check if user exists
        const uRes = await client.query("SELECT id FROM users WHERE username = $1", [username]);
        let userId;

        if (uRes.rows.length > 0) {
            userId = uRes.rows[0].id;
            await client.query(`
                UPDATE users 
                SET password = $1, role_code = 'superadmin', is_active = true, global_access = true 
                WHERE id = $2
            `, [hash, userId]);
            console.log("Existing superadmin user securely updated.");
        } else {
            const ins = await client.query(`
                INSERT INTO users (username, password, role_code, is_active, permissions, global_access)
                VALUES ($1, $2, 'superadmin', true, '{}', true)
                RETURNING id
            `, [username, hash]);
            userId = ins.rows[0].id;
            console.log("New superadmin user organically created.");
        }

        // 2. Assign to all factories
        const facRes = await client.query("SELECT id FROM factories");
        await client.query("DELETE FROM user_factories WHERE user_id = $1", [userId]);
        for (const f of facRes.rows) {
            await client.query("INSERT INTO user_factories (user_id, factory_id, role_code) VALUES ($1, $2, 'superadmin')", [userId, f.id]);
        }

        console.log('=================================');
        console.log('  Admin Authentication Verified  ');
        console.log('=================================');
        console.log(`Username: ${username}`);
        console.log(`Password: ${rawPass}`);
        console.log(`Global Access Granted to ${facRes.rows.length} factories.`);

    } catch (e) {
        console.error('Failed to initialize admin:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

initAdmin();
