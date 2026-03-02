
// 10. JOB CARD PRINT LIST (Aggregated)
app.get('/api/planning/job-cards', async (req, res) => {
    try {
        const { from, to, search } = req.query;

        // We aggregate unique Job Cards from the Details table
        // A Job Card is defined by: OR No + JC No + Mould + Plan Date? 
        // Usually JC No is unique enough, but let's be safe.

        let sql = `
      SELECT DISTINCT ON (
          COALESCE(data->>'jc_no', data->>'job_card_no', ''),
          data->>'or_jr_no',
          data->>'mould_no'
      )
        COALESCE(data->>'jc_no', data->>'job_card_no') as jc_no,
        data->>'or_jr_no' as or_jr_no,
        data->>'mould_no' as mould_no,
        data->>'mould_code' as mould_code,
        data->>'plan_date' as plan_date,
        data->>'client_name' as client_name,
        data->>'machine_name' as machine_name,
        data->>'product_name' as product_name,
        -- Aggregate Items Count
        (SELECT COUNT(*) FROM jc_details d2 
         WHERE COALESCE(d2.data->>'jc_no', d2.data->>'job_card_no') = COALESCE(t1.data->>'jc_no', t1.data->>'job_card_no')
           AND d2.data->>'or_jr_no' = t1.data->>'or_jr_no'
        ) as item_count
      FROM jc_details t1
      WHERE 1=1
    `;

        const params = [];
        const conditions = [];

        // Date Filter (on plan_date)
        if (from) {
            params.push(from);
            conditions.push(`(data->>'plan_date')::date >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            conditions.push(`(data->>'plan_date')::date <= $${params.length}`);
        }

        // Search
        if (search) {
            params.push(`%${search}%`);
            const i = params.length;
            conditions.push(`(
        COALESCE(data->>'jc_no', data->>'job_card_no', '') ILIKE $${i} OR
        data->>'or_jr_no' ILIKE $${i} OR
        data->>'mould_no' ILIKE $${i} OR
        data->>'client_name' ILIKE $${i} OR
        data->>'product_name' ILIKE $${i}
      )`);
        }

        if (conditions.length) {
            sql += ` AND ${conditions.join(' AND ')}`;
        }

        // Order by Date Desc
        sql += ` ORDER BY COALESCE(data->>'jc_no', data->>'job_card_no', ''), data->>'or_jr_no', data->>'mould_no', (data->>'plan_date')::date DESC LIMIT 1000`;

        const rows = await q(sql, params);

        // Sort final result by Date Desc (since DISTINCT ON requires ORDER BY matches)
        // We can do it in JS or wrap in subquery. JS is fine for 1000 rows.
        rows.sort((a, b) => new Date(b.plan_date) - new Date(a.plan_date));

        res.json({ ok: true, data: rows });
    } catch (e) {
        console.error('/api/planning/job-cards error', e);
        res.status(500).json({ ok: false, error: String(e) });
    }
});

// 11. GET SINGLE JOB CARD DETAILS (For Printing)
app.get('/api/planning/job-card-print', async (req, res) => {
    try {
        const { or_jr_no, jc_no, mould_no } = req.query;
        if (!or_jr_no || !jc_no) return res.status(400).json({ ok: false, error: 'Missing OR or JC No' });

        // Fetch all line items for this Job Card
        const sql = `
            SELECT data 
            FROM jc_details 
            WHERE 
              TRIM(data->>'or_jr_no') = $1 AND 
              (TRIM(data->>'jc_no') = $2 OR TRIM(data->>'job_card_no') = $2)
        `;
        const params = [or_jr_no, jc_no];

        // Optional Mould Filter if provided (strictness)
        if (mould_no) {
            // sql += ` AND TRIM(data->>'mould_no') = $3`;
            // params.push(mould_no);
        }

        const rows = await q(sql, params);
        if (!rows.length) return res.status(404).json({ ok: false, error: 'Job Card not found' });

        // Normalize Data
        const items = rows.map(r => r.data);

        // Extract Header Info from first item
        const header = { ...items[0] };
        // Remove item-specific fields from header if desired, but keeping them is fine.

        res.json({ ok: true, header, items });

    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});
