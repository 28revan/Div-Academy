import express from 'express';
import { readDB, writeDB, addLog } from '../dataService.js';

const router = express.Router();

router.get('/projects/:uid', async (req, res) => {
  const { uid } = req.params;
  const data = await readDB();
  const user = data.users.find(u => u.uid === uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.projects || []);
});

router.post('/projects/:uid', async (req, res) => {
  const { uid } = req.params;
  const project = req.body;
  const data = await readDB();
  const userIndex = data.users.findIndex(u => u.uid === uid);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  
  if (!data.users[userIndex].projects) data.users[userIndex].projects = [];
  
  const newProject = {
    id: Date.now().toString(),
    ...project,
    createdAt: new Date().toISOString()
  };
  
  data.users[userIndex].projects.push(newProject);
  await writeDB(data);
  res.status(201).json(newProject);
});

router.delete('/projects/:uid/:projectId', async (req, res) => {
  const { uid, projectId } = req.params;
  const data = await readDB();
  const userIndex = data.users.findIndex(u => u.uid === uid);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  
  if (data.users[userIndex].projects) {
    data.users[userIndex].projects = data.users[userIndex].projects.filter(p => p.id !== projectId);
    await writeDB(data);
  }
  res.json({ success: true });
});

router.post('/submissions/:uid/:taskId', async (req, res) => {
  const { uid, taskId } = req.params;
  const { githubLink } = req.body;
  const data = await readDB();
  
  if (!data.submissions) data.submissions = [];
  
  const submission = {
    id: Date.now().toString(),
    uid,
    taskId,
    githubLink,
    status: 'pending',
    score: null,
    submittedAt: new Date().toISOString()
  };
  
  data.submissions.push(submission);
  
  const student = data.users.find(u => u.uid === uid);
  await addLog(student, 'Task', 'Yeni tapşırıq həlli yüklədi');
  
  await writeDB(data);
  res.status(201).json(submission);
});

router.put('/profile/:uid', async (req, res) => {
  const { uid } = req.params;
  const updates = req.body;
  const data = await readDB();
  const userIndex = data.users.findIndex(u => u.uid === uid);
  
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  
  // Update allowed fields
  const allowedFields = [
    'name', 'email', 'patronymic', 'dob', 'university', 
    'specialty', 'softSkills', 'computerSkills', 
    'githubLink', 'linkedinLink', 'phone'
  ];
  
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      data.users[userIndex][field] = updates[field];
    }
  });

  await writeDB(data);
  res.json(data.users[userIndex]);
});

router.get('/logs/:uid', async (req, res) => {
  const { uid } = req.params;
  const data = await readDB();
  const userLogs = (data.logs || []).filter(log => log.uid === uid);
  res.json(userLogs);
});

export default router;
