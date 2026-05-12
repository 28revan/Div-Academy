import { initDB, getCollection, deleteItem, readDB, writeDB } from './server/dataService.js';
import { seedDB } from './server/seed.js';
import fs from 'fs/promises';

async function reseed() {
  await initDB();
  const collections = ['users', 'groups', 'tasks', 'submissions', 'logs', 'attendance', 'trash'];
  for (const col of collections) {
     const items = await getCollection(col);
     for (const item of items) {
       await deleteItem(col, item.id || item.uid);
     }
  }
  
  try {
     await fs.unlink('./db.json');
  } catch(e) {}
  
  await seedDB();
}
reseed().then(() => console.log('done'));
