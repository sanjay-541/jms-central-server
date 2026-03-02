async function test() {
    const API = 'http://localhost:3000/api';

    try {
        console.log('Testing /api/planning/completed...');
        const res = await fetch(`${API} /planning/completed`);
        const json = await res.json();
        console.log('Response:', json);
    } catch (e) {
        console.error('Completed API Failed', e.message);
    }
}

test();
