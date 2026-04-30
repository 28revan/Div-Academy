import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.resolve(process.cwd(), 'db.json');

export async function readDB() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Database read failed, using empty default:', error.message);
    return {
      users: [],
      groups: [],
      tasks: [],
      submissions: [],
      logs: [],
      attendance: []
    };
  }
}

export async function writeDB(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Data persistence failed (this is expected on Vercel production):', error.message);
  }
}

export async function initDB() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeDB({
      users: [],
      groups: [],
      tasks: [],
      submissions: [],
      logs: [],
      attendance: []
    });
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
  
  // Cleanup
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  data.logs = data.logs.filter(log => new Date(log.timestamp) > thirtyDaysAgo);
  
  await writeDB(data);
  return logEntry;
}

