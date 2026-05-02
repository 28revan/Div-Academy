import express from 'express';
import { getCollection, setItem, deleteItem, readDB, writeDB, addLog } from '../dataService.js';

const router = express.Router();

router.get('/tasks/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const groups = await getCollection('groups');
  const group = groups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group.tasks || []);
});

router.post('/tasks/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { teacherId, ...task } = req.body;
  const group = await findItem('groups', g => g.id === groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  
  if (!group.tasks) group.tasks = [];
  
  const newTask = {
    id: Date.now().toString(),
    ...task,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  group.tasks.push(newTask);
  
  const teacher = await findItem('users', u => u.uid === teacherId);
  await addLog(teacher, 'Assignment', `${group.name} qrupuna yeni tapşırıq verildi: ${task.title}`);
  
  await setItem('groups', groupId, group);
  res.status(201).json(newTask);
});

router.patch('/tasks/:groupId/:taskId', async (req, res) => {
  const { groupId, taskId } = req.params;
  const updates = req.body;
  const group = await findItem('groups', g => g.id === groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  
  const taskIndex = group.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });
  
  group.tasks[taskIndex] = { ...group.tasks[taskIndex], ...updates };
  await setItem('groups', groupId, group);
  res.json(group.tasks[taskIndex]);
});

router.get('/attendance/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const attendance = await getCollection('attendance');
  const filteredAttendance = attendance.filter(a => a.groupId === groupId);
  res.json(filteredAttendance);
});

router.post('/attendance/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { date, records } = req.body; // records: [{ studentId, status: 'present'|'absent', note }]
  
  const newLog = {
    id: Date.now().toString(),
    groupId,
    date,
    records,
    createdAt: new Date().toISOString()
  };
  
  data.attendance.push(newLog);
  await setItem('attendance', newLog.id, newLog);

  // Update student overall attendance
  for (const record of records) {
    const user = await findItem('users', u => u.uid === record.studentId);
    if (user) {
      if (!user.attendedLessons) user.attendedLessons = 0;
      if (!user.totalLessons) user.totalLessons = 0;
      
      user.totalLessons += 1;
      if (record.status === 'present') {
        user.attendedLessons += 1;
      }
      user.attendance = Math.round((user.attendedLessons / user.totalLessons) * 100);
      await setItem('users', user.uid, user);
    }
  }

  res.status(201).json(newLog);
});

router.post('/feedback/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { teacherId, content, type } = req.body; // type: 'teacher' | 'mentor'
  const user = await findItem('users', u => u.uid === studentId);
  if (!user) return res.status(404).json({ error: 'Student not found' });
  
  if (!user.feedbacks) user.feedbacks = [];
  
  const newFeedback = {
    id: Date.now().toString(),
    authorId: teacherId,
    content,
    type,
    date: new Date().toISOString()
  };
  
  user.feedbacks.push(newFeedback);
  await setItem('users', studentId, user);
  res.status(201).json(newFeedback);
});

router.get('/submissions/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const users = await getCollection('users');
  const submissions = await getCollection('submissions');
  const groupUsers = users.filter(u => u.groupId === groupId).map(u => u.uid);
  const filteredSubmissions = submissions.filter(s => groupUsers.includes(s.uid));
  res.json(filteredSubmissions);
});

router.patch('/submissions/:submissionId', async (req, res) => {
  const { submissionId } = req.params;
  const { score, status, mentorFeedback } = req.body;
  const submission = await findItem('submissions', s => s.id === submissionId);
  
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  
  const updatedSubmission = { 
    ...submission, 
    score, 
    status, 
    mentorFeedback,
    gradedAt: new Date().toISOString() 
  };
  
  await setItem('submissions', submissionId, updatedSubmission);
  res.json(updatedSubmission);
});

export default router;
