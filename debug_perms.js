const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function q(text, params) {
    const { rows } = await pool.query(text, params);
    return rows;
}

(async () => {
    try {
        console.log('--- USER PERMISSIONS ---');
        const rows = await q("SELECT username, role_code, permissions FROM users");
        rows.forEach(r => {
            console.log(`User: ${r.username}, Role: '${r.role_code}', Perms: ${JSON.stringify(r.permissions)}`);
        });
        console.log('--- END ---');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
})();
