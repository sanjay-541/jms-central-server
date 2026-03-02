const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'admin',
    port: 5432,
});

async function run() {
    try {
        console.log('Creating notifications table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                target_user TEXT NOT NULL,
                type TEXT DEFAULT 'INFO',
                title TEXT,
                message TEXT,
                link TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_by TEXT DEFAULT 'System',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(target_user);
            CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(target_user, is_read);
        `);

        console.log('Table created successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

run();
