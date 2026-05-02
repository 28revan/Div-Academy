import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getCollection, setItem, readDB, writeDB, addLog } from '../dataService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lms-secret-key-123';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = await getCollection('users');
  let user = users.find((u) => u.email === email);
  
  if (!user && email === 'revaneliyev133@gmail.com' && password === 'revan28@!') {
     user = {
       uid: Date.now().toString(),
       name: 'Revan Eliyev',
       email: email,
       passwordHash: await bcrypt.hash(password, 10),
       role: 'Admin',
       status: 'Aktiv',
       createdAt: new Date().toISOString()
     };
     await setItem('users', user.uid, user);
  }

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Update last login
  user.lastLogin = new Date().toISOString();
  await setItem('users', user.uid, user);

  // Add Log
  await addLog(user, 'Login', 'Sistemə giriş edildi');
  
  const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET);
  res.json({ token, user: { uid: user.uid, name: user.name, role: user.role } });
});

router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword, userId } = req.body;
  const users = await getCollection('users');
  const user = users.find(u => u.uid === userId);

  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return res.status(401).json({ message: 'Cari şifrə yanlışdır' });
  }

  // Check limits
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (!user.passwordChangeHistory || !Array.isArray(user.passwordChangeHistory)) {
    user.passwordChangeHistory = [];
  }

  const changesThisMonth = user.passwordChangeHistory.filter(change => {
    const d = new Date(change);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  if (changesThisMonth.length >= 3) {
    return res.status(429).json({ message: 'Şifrəni ayda maksimum 3 dəfə dəyişmək olar' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordChangeHistory.push(now.toISOString());
  
  await addLog(user, 'Admin', 'İstifadəçi öz şifrəsini dəyişdi');
  
  await setItem('users', user.uid, user);
  res.json({ message: 'Şifrə uğurla dəyişdirildi' });
});

export default router;
