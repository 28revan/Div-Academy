import { readDB, writeDB, initDB } from './server/dataService.js';

async function migrate() {
  console.log('--- Migration Script Started ---');
  await initDB();
  
  console.log('Reading local db.json...');
  const data = await readDB();
  
  console.log('Pushing data to Firestore...');
  await writeDB({...data});
  
  console.log('--- Migration Script Finished ---');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
