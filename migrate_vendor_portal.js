require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Sanjay@541##',
    database: process.env.DB_NAME || 'jpsms'
});

async function runMigration() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creating vendors table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendors (
                id SERIAL PRIMARY KEY,
                vendor_name TEXT NOT NULL,
                gst_no TEXT,
                pan_no TEXT,
                address TEXT,
                contact_person TEXT,
                mobile TEXT,
                email TEXT,
                factory_access JSONB DEFAULT '[]'::jsonb, -- Array of factory IDs
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Creating vendor_users table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendor_users (
                id SERIAL PRIMARY KEY,
                vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
                username TEXT UNIQUE NOT NULL, -- Vendor Code
                password TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Creating purchase_orders table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id SERIAL PRIMARY KEY,
                po_number TEXT UNIQUE NOT NULL,
                po_date DATE DEFAULT CURRENT_DATE,
                vendor_id INTEGER REFERENCES vendors(id),
                factory_id INTEGER REFERENCES factories(id),
                status TEXT DEFAULT 'Open', -- Open, Partial, Closed
                total_amount NUMERIC(15, 2) DEFAULT 0,
                created_by INTEGER REFERENCES users(id),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Creating purchase_order_items table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS purchase_order_items (
                id SERIAL PRIMARY KEY,
                po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
                item_code TEXT,
                item_name TEXT,
                qty NUMERIC(10, 3) DEFAULT 0,
                rate NUMERIC(15, 2) DEFAULT 0,
                delivery_date DATE,
                balance_qty NUMERIC(10, 3) DEFAULT 0, -- Auto-calculated
                received_qty NUMERIC(10, 3) DEFAULT 0,
                status TEXT DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Creating vendor_dispatch table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendor_dispatch (
                id SERIAL PRIMARY KEY,
                dispatch_date DATE DEFAULT CURRENT_DATE,
                vendor_id INTEGER REFERENCES vendors(id),
                po_id INTEGER REFERENCES purchase_orders(id),
                invoice_no TEXT,
                invoice_file TEXT, -- Path to uploaded PDF
                status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
                remarks TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Creating dispatch_items table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS dispatch_items (
                id SERIAL PRIMARY KEY,
                dispatch_id INTEGER REFERENCES vendor_dispatch(id) ON DELETE CASCADE,
                po_item_id INTEGER REFERENCES purchase_order_items(id),
                dispatch_qty NUMERIC(10, 3) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('Creating vendor_payments table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendor_payments (
                id SERIAL PRIMARY KEY,
                vendor_id INTEGER REFERENCES vendors(id),
                po_id INTEGER REFERENCES purchase_orders(id),
                invoice_no TEXT,
                amount NUMERIC(15, 2),
                payment_date DATE,
                payment_status TEXT DEFAULT 'Pending', -- Pending, Paid, Partial
                utr_no TEXT,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // GRN Entries (linking dispatch to stock/approval)
        console.log('Creating grn_entries table...');
        await client.query(`
             CREATE TABLE IF NOT EXISTS grn_entries (
                id SERIAL PRIMARY KEY,
                dispatch_id INTEGER REFERENCES vendor_dispatch(id),
                grn_date DATE DEFAULT CURRENT_DATE,
                approved_by INTEGER REFERENCES users(id),
                remarks TEXT,
                created_at TIMESTAMP DEFAULT NOW()
             );
        `);


        console.log('Creating Indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(vendor_name);
            CREATE INDEX IF NOT EXISTS idx_po_vendor ON purchase_orders(vendor_id);
            CREATE INDEX IF NOT EXISTS idx_po_factory ON purchase_orders(factory_id);
            CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
            CREATE INDEX IF NOT EXISTS idx_dispatch_vendor ON vendor_dispatch(vendor_id);
            CREATE INDEX IF NOT EXISTS idx_dispatch_po ON vendor_dispatch(po_id);
        `);

        await client.query('COMMIT');
        console.log('Vendor Portal Migration Completed Successfully!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
