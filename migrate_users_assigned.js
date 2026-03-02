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
        console.log("Adding assigned_lines column...");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_lines text");
        console.log("Done.");

        // Update Test User (Vipin or similar)
        // Finding user 'Test (Vipin)'
        // Wait, the user said "Assign Line Is B -L2 and C -L2". 
        // I should set assigned_lines = "B -L2,C -L2" for the active user.
        // I'll search for users with line 'B -L2' or similar to guess the user.

        // Let's just update ALL users who have 'B' or 'F' lines to have this assigned just for testing? 
        // Better: Update user 'vipin' or similar if found.
        // I'll update based on the username 'admin' (if that's who is logged in) or I'll just rely on the user to tell me who they are. 
        // Actually, I'll update the user 'Vipin' if he exists.

        // First, list users
        const res = await pool.query("SELECT username, line FROM users");
        console.log("Users:", res.rows);

        pool.end();
    } catch (e) {
        console.error(e);
    }
}
run();
