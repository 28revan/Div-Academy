import express from 'express';
import { readDB, writeDB, addLog } from '../dataService.js';

const router = express.Router();

router.get('/tasks/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const data = await readDB();
  const group = data.groups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group.tasks || []);
});

router.post('/tasks/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { teacherId, ...task } = req.body;
  const data = await readDB();
  const groupIndex = data.groups.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return res.status(404).json({ error: 'Group not found' });
  
  const group = data.groups[groupIndex];
  if (!group.tasks) group.tasks = [];
  
  const newTask = {
    id: Date.now().toString(),
    ...task,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  group.tasks.push(newTask);
  
  const teacher = data.users.find(u => u.uid === teacherId);
  await addLog(teacher, 'Assignment', `${group.name} qrupuna yeni tapşırıq verildi: ${task.title}`);
  
  await writeDB(data);
  res.status(201).json(newTask);
});

router.patch('/tasks/:groupId/:taskId', async (req, res) => {
  const { groupId, taskId } = req.params;
  const updates = req.body;
  const data = await readDB();
  const groupIndex = data.groups.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return res.status(404).json({ error: 'Group not found' });
  
  const taskIndex = data.groups[groupIndex].tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });
  
  data.groups[groupIndex].tasks[taskIndex] = { ...data.groups[groupIndex].tasks[taskIndex], ...updates };
  await writeDB(data);
  res.json(data.groups[groupIndex].tasks[taskIndex]);
});

router.get('/attendance/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const data = await readDB();
  const attendance = (data.attendance || []).filter(a => a.groupId === groupId);
  res.json(attendance);
});

router.post('/attendance/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { date, records } = req.body; // records: [{ studentId, status: 'present'|'absent', note }]
  const data = await readDB();
  
  if (!data.attendance) data.attendance = [];
  
  const newLog = {
    id: Date.now().toString(),
    groupId,
    date,
    records,
    createdAt: new Date().toISOString()
  };
  
  data.attendance.push(newLog);

  // Update student overall attendance
  records.forEach(record => {
    const userIndex = data.users.findIndex(u => u.uid === record.studentId);
    if (userIndex !== -1) {
      const user = data.users[userIndex];
      if (!user.attendedLessons) user.attendedLessons = 0;
      if (!user.totalLessons) user.totalLessons = 0;
      
      user.totalLessons += 1;
      if (record.status === 'present') {
        user.attendedLessons += 1;
      }
      user.attendance = Math.round((user.attendedLessons / user.totalLessons) * 100);
    }
  });

  await writeDB(data);
  res.status(201).json(newLog);
});

router.post('/feedback/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { teacherId, content, type } = req.body; // type: 'teacher' | 'mentor'
  const data = await readDB();
  
  const userIndex = data.users.findIndex(u => u.uid === studentId);
  if (userIndex === -1) return res.status(404).json({ error: 'Student not found' });
  
  if (!data.users[userIndex].feedbacks) data.users[userIndex].feedbacks = [];
  
  const newFeedback = {
    id: Date.now().toString(),
    authorId: teacherId,
    content,
    type,
    date: new Date().toISOString()
  };
  
  data.users[userIndex].feedbacks.push(newFeedback);
  await writeDB(data);
  res.status(201).json(newFeedback);
});

router.get('/submissions/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const data = await readDB();
  const groupUsers = data.users.filter(u => u.groupId === groupId).map(u => u.uid);
  const submissions = (data.submissions || []).filter(s => groupUsers.includes(s.uid));
  res.json(submissions);
});

router.patch('/submissions/:submissionId', async (req, res) => {
  const { submissionId } = req.params;
  const { score, status, mentorFeedback } = req.body;
  const data = await readDB();
  
  const subIndex = data.submissions.findIndex(s => s.id === submissionId);
  if (subIndex === -1) return res.status(404).json({ error: 'Submission not found' });
  
  data.submissions[subIndex] = { 
    ...data.submissions[subIndex], 
    score, 
    status, 
    mentorFeedback,
    gradedAt: new Date().toISOString() 
  };
  
  await writeDB(data);
  res.json(data.submissions[subIndex]);
});

export default router;
