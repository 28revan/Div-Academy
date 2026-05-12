import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs/promises';
import path from 'path';

// Load config from root
import firebaseConfig from '../firebase-applet-config.json' with { type: "json" };

let db = null;
let authApp = null;
let memoryDB = null;
const DATA_FILE = path.resolve(process.cwd(), 'db.json');

export async function initDB() {
  if (db) return;
  
  try {
    const app = initializeApp(firebaseConfig);
    authApp = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

    // Login as admin so the backend has permission to write and bypass some rules
    try {
      await signInWithEmailAndPassword(authApp, 'revaneliyev133@gmail.com', 'revan28@!');
      console.log('Firebase backend initialized and authenticated via Client SDK.');
    } catch (authError) {
      console.warn('Backend login failed, attempting to create admin user...', authError.message);
      try {
        await createUserWithEmailAndPassword(authApp, 'revaneliyev133@gmail.com', 'revan28@!');
        console.log('Admin user created and authenticated successfully.');
      } catch (createError) {
        console.error('Could not create or login admin user:', createError.message);
        // If we can't authenticate, we probably shouldn't use db to avoid silent fallback bugs depending on the rule configs.
        // But we will keep db enabled and let rules reject, then fallback if needed.
      }
    }
  } catch (error) {
    console.error('Firebase Client DB initialization failed:', error);
  }
}

export async function readDB() {
  if (memoryDB) return memoryDB;

  if (db) {
    try {
      const collections = ['users', 'groups', 'tasks', 'submissions', 'logs', 'attendance', 'trash'];
      const data = {};
      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        data[colName] = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id, uid: d.id }));
      }
      memoryDB = data;
      return data;
    } catch (error) {
      console.error('Firestore client read failed:', error.message);
      // Proceed to fallback
    }
  }

  // Fallback to memory / local JSON
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    memoryDB = JSON.parse(content);
    return memoryDB;
  } catch (error) {
    memoryDB = { users: [], groups: [], tasks: [], submissions: [], logs: [], attendance: [], trash: [] };
    return memoryDB;
  }
}

export async function writeDB(data) {
  memoryDB = data;
  
  // Only write to the local file, avoid destructive bulk overwrites to Firestore
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {}
}

export async function getCollection(colName) {
  if (!db) await initDB();
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, colName));
      return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id, uid: d.id }));
    } catch (e) {
      console.error('Firestore getDocs failed for', colName, e.message);
      // Fallback to local DB on error (e.g. Permission Denied)
    }
  }
  const data = await readDB();
  return data[colName] || [];
}

export async function findItem(colName, predicate) {
  const coll = await getCollection(colName);
  return coll.find(predicate);
}

export async function setItem(colName, id, itemData) {
  if (!db) await initDB();
  if (db) {
    try {
      const docRef = doc(db, colName, String(id));
      await setDoc(docRef, { ...itemData, id, uid: id }, { merge: true });
      return;
    } catch (e) {
      console.error('Firestore setItem failed for', colName, 'id:', id, e.message);
      // Fallback
    }
  }
  const data = await readDB();
  if (!data[colName]) data[colName] = [];
  const idx = data[colName].findIndex(i => (i.id === id || i.uid === id));
  if (idx !== -1) {
    data[colName][idx] = { ...data[colName][idx], ...itemData, id, uid: id };
  } else {
    data[colName].push({ ...itemData, id, uid: id });
  }
  await writeDB(data);
}

export async function deleteItem(colName, id) {
  if (!db) await initDB();
  if (db) {
    try {
      const docRef = doc(db, colName, String(id));
      await deleteDoc(docRef);
      return;
    } catch (e) {
      console.error('Firestore deleteItem failed for', colName, 'id:', id, e.message);
      // Fallback
    }
  }
  const data = await readDB();
  if (data[colName]) {
    data[colName] = data[colName].filter(i => (i.id !== id && i.uid !== id));
    await writeDB(data);
  }
}

export async function addLog(user, type, description, ip = '127.0.0.1') {
  if (!db) await initDB();
  
  const now = new Date();
  const logEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: now.toISOString(),
    userName: user?.name || 'System',
    userEmail: user?.email || 'system@div.edu.az',
    userRole: user?.role || 'System',
    uid: user?.uid || 'system',
    type,
    description,
    ip
  };

  if (db) {
    try {
      const docRef = doc(db, 'logs', String(logEntry.id));
      await setDoc(docRef, logEntry);
    } catch (e) {
      console.error('Failed to write log to Firestore:', e.message);
    }
  }

  if (!memoryDB) await readDB();
  if (memoryDB) {
    if (!memoryDB.logs) memoryDB.logs = [];
    memoryDB.logs.push(logEntry);
    if (!db) {
      try {
        await fs.writeFile(DATA_FILE, JSON.stringify(memoryDB, null, 2));
      } catch (err) {}
    }
  }

  cleanupOldLogs().catch(e => console.error('Log cleanup error:', e));
  return logEntry;
}

export async function cleanupOldLogs() {
  if (!db) return;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS);
  const cutoffISO = cutoffDate.toISOString();

  try {
    const q = query(collection(db, 'logs'), where('timestamp', '<', cutoffISO));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
    }
  } catch (e) {
    console.error('Error cleaning up firestore logs:', e.message);
  }
}

