import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs/promises';
import path from 'path';

let db = null;

try {
  // Try initializing Firebase Admin
  let adminApp;
  try { adminApp = getApp(); } catch (e) {}
  
  if (!adminApp) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT yoxdur. Vercel-də işləmək üçün bu environment variable əlavə edilməlidir. Müvəqqəti yaddaşdan istifadə olunur.');
    }
  }
  
  if (adminApp) {
    db = getFirestore(adminApp);
  }
} catch (error) {
  console.error('Firebase Admin başlatmaq mümkün olmadı:', error);
}

const DATA_FILE = path.resolve(process.cwd(), 'db.json');
let memoryDB = null;

export async function readDB() {
  if (db) {
    try {
      const collections = ['users', 'groups', 'tasks', 'submissions', 'logs', 'attendance', 'trash'];
      const data = {};
      for (const colName of collections) {
        const snapshot = await db.collection(colName).get();
        data[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      return data;
    } catch (error) {
      console.error('Firestore Admin read failed:', error.message);
    }
  }

  // Fallback to memory / local JSON
  if (memoryDB) return memoryDB;
  
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    memoryDB = JSON.parse(content);
    return memoryDB;
  } catch (error) {
    console.warn('Database read failed, using empty default');
    memoryDB = { users: [], groups: [], tasks: [], submissions: [], logs: [], attendance: [], trash: [] };
    return memoryDB;
  }
}

export async function writeDB(data) {
  memoryDB = data;
  
  if (db) {
    try {
      const collections = ['users', 'groups', 'tasks', 'submissions', 'logs', 'attendance', 'trash'];
      const batch = db.batch();
      for (const colName of collections) {
        if (data[colName] && Array.isArray(data[colName])) {
           for (const item of data[colName]) {
              const id = item.id || item.uid || db.collection(colName).doc().id;
              const { id: _, uid: __, ...rest } = item;
              batch.set(db.collection(colName).doc(String(id)), { ...rest, id, uid: id }, { merge: true });
           }
        }
      }
      await batch.commit();
      return;
    } catch (error) {
      console.error('Firestore Admin write failed:', error.message);
    }
  }

  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Data persistence failed (expected on Vercel):', error.message);
  }
}

export async function initDB() {
  if (db) {
     console.log('Using Firebase Firestore as databases');
     return;
  }
  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeDB({ users: [], groups: [], tasks: [], submissions: [], logs: [], attendance: [] });
  }
}

export async function addLog(user, type, description, ip = '127.0.0.1') {
  const data = await readDB();
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
  if (!data.logs) data.logs = [];
  data.logs.push(logEntry);
  await writeDB(data);
  
  // Asynchronously clean up old logs
  cleanupOldLogs().catch(e => console.error('Log cleanup error:', e));

  return logEntry;
}

export async function cleanupOldLogs() {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS);
  const cutoffISO = cutoffDate.toISOString();

  // If using Firestore, delete old logs there
  if (db) {
    try {
      const logsRef = db.collection('logs');
      const snapshot = await logsRef.get();
      const batch = db.batch();
      let hasDeletes = false;
      
      snapshot.docs.forEach(doc => {
        const docData = doc.data();
        if (docData.timestamp && docData.timestamp < cutoffISO) {
          batch.delete(doc.ref);
          hasDeletes = true;
        }
      });
      
      if (hasDeletes) {
        await batch.commit();
        console.log('Old logs cleaned from Firestore');
      }
    } catch (e) {
      console.error('Error cleaning up firestore logs:', e.message);
    }
  }

  // Handle local memory / file DB
  if (memoryDB && memoryDB.logs) {
    const originalLength = memoryDB.logs.length;
    memoryDB.logs = memoryDB.logs.filter(log => log.timestamp >= cutoffISO);
    if (memoryDB.logs.length < originalLength) {
      try {
        await fs.writeFile(DATA_FILE, JSON.stringify(memoryDB, null, 2));
      } catch (err) {
        // Expected on vercel
      }
    }
  }
}

