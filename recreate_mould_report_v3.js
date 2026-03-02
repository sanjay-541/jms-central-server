const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function run() {
    const client = await pool.connect();
    try {
        console.log("Dropping old table...");
        await client.query('DROP TABLE IF EXISTS mould_planning_report');

        console.log("Creating new table with ID as Primary Key...");
        await client.query(`
      CREATE TABLE mould_planning_report (
        id SERIAL PRIMARY KEY,
        or_jr_no TEXT,         -- No longer PK/Unique
        or_jr_date TEXT, 
        item_code TEXT, 
        bom_type TEXT,
        product_name TEXT, 
        jr_qty TEXT, 
        uom TEXT,
        plan_date TEXT, 
        plan_qty TEXT,
        mould_item_code TEXT,
        mould_item_name TEXT,
        mould_no TEXT,
        mould_name TEXT,
        mould_item_qty TEXT,
        tonnage TEXT,
        machine_name TEXT,
        cycle_time TEXT,
        cavity TEXT,
        
        _status TEXT,
        created_by TEXT, 
        created_date TIMESTAMP DEFAULT NOW(),
        edited_by TEXT, 
        edited_date TIMESTAMP DEFAULT NOW(),
        
        remarks_all TEXT
      );
      
      -- Add index for fast lookups by OrderNo
      CREATE INDEX idx_mpr_order ON mould_planning_report(or_jr_no);
    `);

        console.log("Table mould_planning_report re-created successfully.");
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}
run();
