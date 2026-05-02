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
  if (memoryDB) return memoryDB;

  if (db) {
    try {
      const collections = ['users', 'groups', 'tasks', 'submissions', 'logs', 'attendance', 'trash'];
      const data = {};
      for (const colName of collections) {
        const snapshot = await db.collection(colName).get();
        data[colName] = snapshot.docs.map(doc => {
          const itemData = doc.data();
          const id = doc.id;
          return { ...itemData, id, uid: id };
        });
      }
      memoryDB = data;
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
      // In a real app, we should only write changes. 
      // But to keep compatibility with the existing route pattern:
      const collections = ['users', 'groups', 'tasks', 'submissions', 'logs', 'attendance', 'trash'];
      
      for (const colName of collections) {
        if (data[colName] && Array.isArray(data[colName])) {
           // Break into chunks of 450 to stay under Firestore batch limit (500)
           const items = data[colName];
           for (let i = 0; i < items.length; i += 450) {
             const chunk = items.slice(i, i + 450);
             const batch = db.batch();
             for (const item of chunk) {
                const id = String(item.uid || item.id || db.collection(colName).doc().id);
                const { id: _, uid: __, ...rest } = item;
                batch.set(db.collection(colName).doc(id), { ...rest, id, uid: id }, { merge: true });
             }
             await batch.commit();
           }
        }
      }
      return;
    } catch (error) {
      console.error('Firestore Admin write failed:', error.message);
    }
  }

  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    // Expected error on Vercel read-only filesystem
  }
}

export async function initDB() {
  if (db) {
     console.log('Using Firebase Firestore as backend');
     return;
  }
  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeDB({ users: [], groups: [], tasks: [], submissions: [], logs: [], attendance: [], trash: [] });
  }
}

// Granular Operations
export async function getCollection(colName) {
  if (db) {
    const snapshot = await db.collection(colName).get();
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id }));
  }
  const data = await readDB();
  return data[colName] || [];
}

export async function findItem(colName, predicate) {
  const collection = await getCollection(colName);
  return collection.find(predicate);
}

export async function setItem(colName, id, itemData) {
  if (db) {
    const docRef = db.collection(colName).doc(String(id));
    await docRef.set({ ...itemData, id, uid: id }, { merge: true });
    return;
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
  if (db) {
    await db.collection(colName).doc(String(id)).delete();
    return;
  }
  const data = await readDB();
  if (data[colName]) {
    data[colName] = data[colName].filter(i => (i.id !== id && i.uid !== id));
    await writeDB(data);
  }
}

export async function addLog(user, type, description, ip = '127.0.0.1') {
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
      await db.collection('logs').doc(String(logEntry.id)).set(logEntry);
    } catch (e) {
      console.error('Failed to write log to Firestore:', e.message);
    }
  }

  // Also maintain local/memory DB
  if (!memoryDB) {
    await readDB();
  }
  if (memoryDB) {
    if (!memoryDB.logs) memoryDB.logs = [];
    memoryDB.logs.push(logEntry);
    if (!db) {
      try {
        await fs.writeFile(DATA_FILE, JSON.stringify(memoryDB, null, 2));
      } catch (err) {}
    }
  }

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
      const snapshot = await logsRef.where('timestamp', '<', cutoffISO).get();
      
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
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
    if (memoryDB.logs.length < originalLength && !db) {
      try {
        await fs.writeFile(DATA_FILE, JSON.stringify(memoryDB, null, 2));
      } catch (err) {
        // Expected on vercel
      }
    }
  }
}

