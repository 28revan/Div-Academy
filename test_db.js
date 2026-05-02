import { initDB, getCollection } from './server/dataService.js';
import { getAuth } from 'firebase/auth';

async function run() {
  await initDB();
  const auth = getAuth();
  console.log('CURRENT USER:', auth.currentUser?.email, auth.currentUser?.uid);
  
  for (const col of ['trash', 'users', 'groups']) {
    try {
      const res = await getCollection(col);
      console.log(`FETCHED ${col}:`, res.length, 'items');
    } catch (e) {
      console.log(`ERROR ${col}:`, e.message);
    }
  }
  process.exit(0);
}
run();
