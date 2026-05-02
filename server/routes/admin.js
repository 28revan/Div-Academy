import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { getCollection, findItem, setItem, deleteItem, readDB, writeDB, addLog } from '../dataService.js';

const router = express.Router();

router.get('/users', async (req, res) => {
  const users = await getCollection('users');
  res.json(users);
});

router.get('/logs', async (req, res) => {
  const logs = await getCollection('logs');
  res.json(logs);
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
  const users = await getCollection('users');
  
  if (users.find((u) => u.email === email)) {
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
  
  await addLog(null, 'Admin', `Yeni istifadəçi əlavə edildi: ${newUser.name} (${newUser.role})`);
  await setItem('users', newUser.uid, newUser);
  res.status(201).json({ uid: newUser.uid, role: newUser.role, name: newUser.name });
});

router.patch('/users/:uid', async (req, res) => {
  const { uid } = req.params;
  const { newPassword, ...updates } = req.body;
  const user = await findItem('users', u => u.uid === uid);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (newPassword) {
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await addLog(null, 'Admin', `${user.name} adlı istifadəçinin şifrəsi yeniləndi`);
  }

  const updatedUser = { ...user, ...updates };
  await addLog(null, 'Admin', `${user.name} adlı istifadəçi məlumatları yeniləndi`);
  await setItem('users', uid, updatedUser);
  res.json(updatedUser);
});

router.delete('/users/:uid', async (req, res) => {
    const { uid } = req.params;
    const { deletedBy } = req.body;
    const user = await findItem('users', u => u.uid === uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const trashItem = {
      id: Date.now().toString(),
      type: 'İstifadəçi',
      data: user,
      deletedBy: deletedBy || 'Admin',
      deletedAt: new Date().toISOString()
    };
    
    await setItem('trash', trashItem.id, trashItem);
    await deleteItem('users', uid);
    await addLog(null, 'Admin', `${user.name} (${user.role}) adlı istifadəçi silindi`);
    res.json({ message: 'User deleted' });
});

router.get('/groups', async (req, res) => {
  const groups = await getCollection('groups');
  res.json(groups);
});

router.post('/groups', async (req, res) => {
  const { name, teacherId, mentorId, students } = req.body;
  
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

  await setItem('groups', newGroup.id, newGroup);
  
  // Update students group ID
  for (const studentId of students) {
    const student = await findItem('users', u => u.uid === studentId);
    if (student) {
      await setItem('users', studentId, { ...student, groupId: newGroup.id });
    }
  }

  await addLog(null, 'Admin', `Yeni qrup yaradıldı: ${newGroup.name}`);
  res.status(201).json(newGroup);
});

router.patch('/groups/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const groups = await getCollection('groups');
  
  const group = groups.find(g => g.id === id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  
  const updatedGroup = { ...group, ...updates };
  await setItem('groups', id, updatedGroup);
  res.json(updatedGroup);
});

router.delete('/groups/:id', async (req, res) => {
  const { id } = req.params;
  const { deletedBy } = req.body;
  const group = await findItem('groups', g => g.id === id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const trashItem = {
    id: Date.now().toString(),
    type: 'Qrup',
    data: group,
    deletedBy: deletedBy || 'Admin',
    deletedAt: new Date().toISOString()
  };
  
  await setItem('trash', trashItem.id, trashItem);
  await deleteItem('groups', id);
  await addLog(null, 'Admin', `${group.name} adlı qrup silindi`);
  res.json({ message: 'Group deleted' });
});

router.get('/trash', async (req, res) => {
  const trash = await getCollection('trash');
  const now = new Date();
  const validTrashItems = [];

  for (const item of trash) {
    const deletedAtDate = new Date(item.deletedAt);
    const diffTime = Math.abs(now - deletedAtDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays > 30) {
      await deleteItem('trash', item.id);
    } else {
      validTrashItems.push(item);
    }
  }

  res.json(validTrashItems);
});

router.delete('/trash/:id', async (req, res) => {
  const { id } = req.params;
  await deleteItem('trash', id);
  res.json({ message: 'Permanently deleted' });
});

router.post('/trash/:id/restore', async (req, res) => {
  const { id } = req.params;
  const trash = await getCollection('trash');
  const users = await getCollection('users');
  
  const item = trash.find(t => t.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found in trash' });
  
  if (item.type === 'İstifadəçi') {
     await setItem('users', item.data.uid, item.data);
  } else if (item.type === 'Qrup') {
     await setItem('groups', item.data.id, item.data);
  } else if (item.type === 'Tapşırıq') {
     const groupId = item.data._groupId;
     const group = await findItem('groups', g => g.id === groupId);
     if (group) {
        if (!group.tasks) group.tasks = [];
        delete item.data._groupId;
        group.tasks.push(item.data);
        await setItem('groups', groupId, group);
     }
  } else if (item.type === 'Layihə') {
     const ownerUid = item.data._ownerUid;
     const user = users.find(u => u.uid === ownerUid);
     if (user) {
       if (!user.projects) user.projects = [];
       const { _ownerUid, ...projectData } = item.data;
       user.projects.push(projectData);
       await setItem('users', ownerUid, user);
     }
  }
  
  await deleteItem('trash', id);
  
  await addLog(null, 'Admin', `${item.data.name || 'Öge'} zibil qutusundan geri qaytarıldı`);
  res.json({ message: 'Restored successfully' });
});

export default router;
