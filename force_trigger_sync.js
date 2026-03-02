
const syncService = require('./services/sync.service');

try {
    console.log('Testing syncService.triggerSync()...');
    if (typeof syncService.triggerSync === 'function') {
        console.log('[OK] triggerSync is a function.');
    } else {
        console.error('[FAIL] triggerSync is NOT a function. It is:', typeof syncService.triggerSync);
    }
} catch (e) {
    console.error(e);
}
