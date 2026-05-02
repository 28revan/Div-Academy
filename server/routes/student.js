import express from 'express';
import { getCollection, findItem, setItem, deleteItem, readDB, writeDB, addLog } from '../dataService.js';

const router = express.Router();

router.get('/projects/:uid', async (req, res) => {
  const { uid } = req.params;
  const users = await getCollection('users');
  const user = users.find(u => u.uid === uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.projects || []);
});

router.post('/projects/:uid', async (req, res) => {
  const { uid } = req.params;
  const project = req.body;
  const user = await findItem('users', u => u.uid === uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (!user.projects) user.projects = [];
  
  const newProject = {
    id: Date.now().toString(),
    ...project,
    createdAt: new Date().toISOString()
  };
  
  user.projects.push(newProject);
  await setItem('users', uid, user);
  res.status(201).json(newProject);
});

router.delete('/projects/:uid/:projectId', async (req, res) => {
  const { uid, projectId } = req.params;
  const { deletedBy } = req.body || {};
  const user = await findItem('users', u => u.uid === uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (user.projects) {
    const projectToDelete = user.projects.find(p => p.id === projectId);
    if (projectToDelete) {
      const trashItem = {
        id: Date.now().toString(),
        type: 'Layihə',
        data: { ...projectToDelete, _ownerUid: uid },
        deletedBy: deletedBy || user.name,
        deletedAt: new Date().toISOString()
      };
      await setItem('trash', trashItem.id, trashItem);
    }
    user.projects = user.projects.filter(p => p.id !== projectId);
    await setItem('users', uid, user);
  }
  res.json({ success: true });
});

router.post('/submissions/:uid/:taskId', async (req, res) => {
  const { uid, taskId } = req.params;
  const { githubLink } = req.body;
  
  const student = await findItem('users', u => u.uid === uid);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  
  const submission = {
    id: Date.now().toString(),
    uid,
    taskId,
    githubLink,
    status: 'pending',
    score: null,
    submittedAt: new Date().toISOString()
  };
  
  await addLog(student, 'Task', 'Yeni tapşırıq həlli yüklədi');
  
  await setItem('submissions', submission.id, submission);
  res.status(201).json(submission);
});

router.put('/profile/:uid', async (req, res) => {
  const { uid } = req.params;
  const updates = req.body;
  const user = await findItem('users', u => u.uid === uid);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Update allowed fields
  const allowedFields = [
    'name', 'email', 'patronymic', 'dob', 'university', 
    'specialty', 'softSkills', 'computerSkills', 
    'githubLink', 'linkedinLink', 'phone'
  ];
  
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  });

  await setItem('users', uid, user);
  res.json(user);
});

router.get('/logs/:uid', async (req, res) => {
  const { uid } = req.params;
  const logs = await getCollection('logs');
  const userLogs = logs.filter(log => log.uid === uid);
  res.json(userLogs);
});

export default router;
