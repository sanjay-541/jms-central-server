const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres', host: 'localhost', database: 'jpsms', password: process.env.PGPASSWORD || 'Sanjay@541##', port: 5432
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'moulds'
        `);
        console.log('Table: moulds');
        if (res.rows.length === 0) {
            console.log('Table NOT FOUND or has no columns.');
        } else {
            console.log('Columns found:', res.rows.length);
            console.log(res.rows.map(r => r.column_name).join(', '));
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
check();
