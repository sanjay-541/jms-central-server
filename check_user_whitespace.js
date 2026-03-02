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
        const res = await pool.query(`SELECT username, line FROM users ORDER BY username`);
        console.log("Users and Lines (brackets show whitespace):");
        res.rows.forEach(r => {
            console.log(`User: [${r.username}], Line: [${r.line}]`);
        });
        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
}
run();
