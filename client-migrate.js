import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import fs from 'fs/promises';
import path from 'path';

// Firebase Client Configuration
const firebaseConfig = {
  projectId: "gen-lang-client-0693702018",
  appId: "1:448883375139:web:d95a9d54e694d084de0596",
  apiKey: "AIzaSyBHrXcSlGa-FDzDESpGz88OMpeKGzVCP0I",
  authDomain: "gen-lang-client-0693702018.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-60afc7ab-8316-4a28-9480-3929850154f9",
  storageBucket: "gen-lang-client-0693702018.firebasestorage.app",
  messagingSenderId: "448883375139",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function migrate() {
  console.log('--- Migration Script (Client SDK) Started ---');
  
  // Login as admin
  try {
    console.log('Logging in as Admin...');
    await signInWithEmailAndPassword(auth, 'revaneliyev133@gmail.com', 'revan28@!');
    console.log('Logged in successfully!');
  } catch (error) {
    console.error('Failed to log in as admin:', error);
    process.exit(1);
  }

  // Read local DB
  const DATA_FILE = path.resolve(process.cwd(), 'db.json');
  let data = {};
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    data = JSON.parse(content);
    console.log(`Read local db.json successfully. Found collections: ${Object.keys(data).join(', ')}`);
  } catch (e) {
    console.error('Could not read db.json', e);
    process.exit(1);
  }

  // Upload to Firestore using Batches
  const collections = Object.keys(data);
  for (const colName of collections) {
    const items = data[colName];
    if (Array.isArray(items) && items.length > 0) {
      console.log(`Migrating collection: ${colName} (${items.length} items)...`);
      
      for (let i = 0; i < items.length; i += 450) {
        const chunk = items.slice(i, i + 450);
        const batch = writeBatch(db);
        
        for (const item of chunk) {
          const id = String(item.uid || item.id || Date.now().toString());
          const { id: _, uid: __, ...rest } = item; // remove duplicate ID fields to avoid overwriting rules loosely
          const docRef = doc(db, colName, id);
          batch.set(docRef, { ...rest, id, uid: id }, { merge: true });
        }
        
        await batch.commit();
        console.log(` - Uploaded ${chunk.length} items to ${colName}`);
      }
    }
  }

  console.log('--- Migration completed successfully! data is now in Firebase. ---');
  process.exit(0);
}

migrate();
