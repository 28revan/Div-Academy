import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { readDB, writeDB, addLog } from '../dataService.js';

const router = express.Router();

router.get('/users', async (req, res) => {
  const data = await readDB();
  res.json(data.users);
});

router.get('/logs', async (req, res) => {
  const data = await readDB();
  res.json(data.logs || []);
});

router.post('/users', [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['Admin', 'Teacher', 'Mentor', 'Student'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role, fin, phone, status, specialty, university } = req.body;
  const data = await readDB();
  
  if (data.users.find((u) => u.email === email)) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password || 'Div123456!', 10);
  const newUser = {
    uid: Date.now().toString(),
    name,
    email,
    passwordHash,
    role,
    fin: fin || '0000000',
    phone: phone || '',
    status: status || 'Active',
    specialty: specialty || 'N/A',
    university: university || 'N/A',
    balance: 0,
    groupId: null,
    passwordChangeHistory: [],
    createdAt: new Date().toISOString()
  };
  
  data.users.push(newUser);
  await addLog(null, 'Admin', `Yeni istifadəçi əlavə edildi: ${newUser.name} (${newUser.role})`);
  await writeDB(data);
  res.status(201).json({ uid: newUser.uid, role: newUser.role, name: newUser.name });
});

router.patch('/users/:uid', async (req, res) => {
  const { uid } = req.params;
  const { newPassword, ...updates } = req.body;
  const data = await readDB();
  
  const index = data.users.findIndex(u => u.uid === uid);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  
  let user = data.users[index];
  
  if (newPassword) {
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await addLog(null, 'Admin', `${user.name} adlı istifadəçinin şifrəsi yeniləndi`);
  }

  data.users[index] = { ...user, ...updates };
  await addLog(null, 'Admin', `${user.name} adlı istifadəçi məlumatları yeniləndi`);
  await writeDB(data);
  res.json(data.users[index]);
});

router.delete('/users/:uid', async (req, res) => {
    const { uid } = req.params;
    const { deletedBy } = req.body;
    const data = await readDB();
    
    const user = data.users.find(u => u.uid === uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Ensure trash collection exists
    if (!data.trash) data.trash = [];
    
    // Add to trash
    data.trash.push({
      id: Date.now().toString(),
      type: 'İstifadəçi',
      data: user,
      deletedBy: deletedBy || 'Admin',
      deletedAt: new Date().toISOString()
    });

    data.users = data.users.filter(u => u.uid !== uid);
    await addLog(null, 'Admin', `${user.name} (${user.role}) adlı istifadəçi silindi`);
    await writeDB(data);
    res.json({ message: 'User deleted' });
});

router.get('/groups', async (req, res) => {
  const data = await readDB();
  res.json(data.groups);
});

router.post('/groups', async (req, res) => {
  const { name, teacherId, mentorId, students } = req.body;
  const data = await readDB();
  
  const newGroup = {
    id: 'g-' + Date.now().toString(),
    name,
    teacherId,
    mentorId,
    students,
    tasks: [],
    progress: 0,
    avgGrade: 0,
    health: 'Healthy',
    schedule: { days: ['B.e.', 'C.a.'], time: '19:00 - 21:00' }
  };

  data.groups.push(newGroup);
  
  data.users = data.users.map(u => {
    if (students.includes(u.uid)) return { ...u, groupId: newGroup.id };
    return u;
  });

  await addLog(null, 'Admin', `Yeni qrup yaradıldı: ${newGroup.name}`);
  await writeDB(data);
  res.status(201).json(newGroup);
});

router.patch('/groups/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const data = await readDB();
  
  const index = data.groups.findIndex(g => g.id === id);
  if (index === -1) return res.status(404).json({ error: 'Group not found' });
  
  data.groups[index] = { ...data.groups[index], ...updates };
  await writeDB(data);
  res.json(data.groups[index]);
});

router.get('/trash', async (req, res) => {
  const data = await readDB();
  res.json(data.trash || []);
});

router.delete('/trash/:id', async (req, res) => {
  const { id } = req.params;
  const data = await readDB();
  
  if (!data.trash) data.trash = [];
  data.trash = data.trash.filter(t => t.id !== id);
  await writeDB(data);
  res.json({ message: 'Permanently deleted' });
});

router.post('/trash/:id/restore', async (req, res) => {
  const { id } = req.params;
  const data = await readDB();
  
  if (!data.trash) data.trash = [];
  const itemIndex = data.trash.findIndex(t => t.id === id);
  if (itemIndex === -1) return res.status(404).json({ error: 'Item not found in trash' });
  
  const item = data.trash[itemIndex];
  
  if (item.type === 'İstifadəçi') {
     data.users.push(item.data);
  } else if (item.type === 'Layihə') {
     const ownerUid = item.data._ownerUid;
     const userIndex = data.users.findIndex(u => u.uid === ownerUid);
     if (userIndex !== -1) {
       if (!data.users[userIndex].projects) data.users[userIndex].projects = [];
       const { _ownerUid, ...projectData } = item.data;
       data.users[userIndex].projects.push(projectData);
     }
  }
  // Remove from trash
  data.trash.splice(itemIndex, 1);
  
  await addLog(null, 'Admin', `${item.data.name || 'Öge'} zibil qutusundan geri qaytarıldı`);
  await writeDB(data);
  res.json({ message: 'Restored successfully' });
});

export default router;
