
const rows = [
    { or_jr_no: 'A', mould_no: 'M1', mold_item_code: 'I1', plan_date: '2024-01-01', val: 1 },
    { or_jr_no: 'A', mould_no: 'M1', mold_item_code: 'I1', plan_date: '2024-01-01', val: 2 }, // Duplicate
    { or_jr_no: 'B', mould_no: 'M2', mold_item_code: 'I2', plan_date: '2024-01-02', val: 3 }
];

console.log('Original Length:', rows.length);

const uniqueMap = new Map();
for (const r of rows) {
    const { ...data } = r;
    const or = String(data.or_jr_no || '').trim();
    const mould = String(data.mould_no || '').trim();
    const item = String(data.mold_item_code || '').trim();
    const date = String(data.plan_date || '').trim();

    const uniqueKey = `${or}|${mould}|${item}|${date}`;
    console.log('Key:', uniqueKey);

    uniqueMap.set(uniqueKey, { data, uniqueKey });
}

const distinctRows = Array.from(uniqueMap.values());
console.log('Deduplicated Length:', distinctRows.length);
distinctRows.forEach(r => console.log('Row:', r.data.val));
