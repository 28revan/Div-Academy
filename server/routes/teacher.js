import express from 'express';
import { getCollection, findItem, setItem, deleteItem, readDB, writeDB, addLog } from '../dataService.js';

const router = express.Router();

router.get('/tasks/:groupId', async (req, res) => {
  try {
  const { groupId } = req.params;
  const groups = await getCollection('groups');
  const group = groups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group.tasks || []);
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks/:groupId', async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/tasks/:groupId/:taskId', async (req, res) => {
  try {
  const { groupId, taskId } = req.params;
  const updates = req.body;
  const group = await findItem('groups', g => g.id === groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  
  const taskIndex = group.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });
  
  group.tasks[taskIndex] = { ...group.tasks[taskIndex], ...updates };
  await setItem('groups', groupId, group);
  res.json(group.tasks[taskIndex]);
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/tasks/:groupId/:taskId', async (req, res) => {
  try {
  const { groupId, taskId } = req.params;
  const { deletedBy } = req.body;
  const group = await findItem('groups', g => g.id === groupId);
  if (!group || !group.tasks) return res.status(404).json({ error: 'Group or tasks not found' });
  
  const taskIndex = group.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });
  
  const task = group.tasks[taskIndex];
  
  const trashItem = {
    id: Date.now().toString(),
    type: 'Tapşırıq',
    data: { ...task, _groupId: groupId },
    deletedBy: deletedBy || 'Müəllim/Menecer',
    deletedAt: new Date().toISOString()
  };
  
  await setItem('trash', trashItem.id, trashItem);
  
  group.tasks.splice(taskIndex, 1);
  await setItem('groups', groupId, group);
  await addLog(null, deletedBy || 'Sistem', `${task.title} adlı tapşırıq silindi`);
  res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/attendance/:groupId', async (req, res) => {
  try {
  const { groupId } = req.params;
  const attendance = await getCollection('attendance');
  const filteredAttendance = attendance.filter(a => a.groupId === groupId);
  res.json(filteredAttendance);
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/attendance/:groupId', async (req, res) => {
  try {
  const { groupId } = req.params;
  const { date, records } = req.body; // records: [{ studentId, status: 'present'|'absent', note }]
  
  const allAtt = await getCollection('attendance');
  // Check if a log for this date and group already exists
  const existingLog = allAtt.find(a => a.groupId === groupId && a.date === date);

  let logId;
  let isUpdate = false;
  
  if (existingLog) {
    isUpdate = true;
    logId = existingLog.id;
    existingLog.records = records;
    existingLog.updatedAt = new Date().toISOString();
    await setItem('attendance', logId, existingLog);
  } else {
    logId = Date.now().toString();
    const newLog = {
      id: logId,
      groupId,
      date,
      records,
      createdAt: new Date().toISOString()
    };
    await setItem('attendance', logId, newLog);
  }

  // We should ideally recalculate attendance properly by traversing all logs for a user, 
  // but for simplicity we will just do a full recalculation here.
  const allUpdatedAtt = await getCollection('attendance');
  const userIds = [...new Set(records.map(r => r.studentId))];
  
  for (const uid of userIds) {
    const user = await findItem('users', u => u.uid === uid);
    if (user) {
      let attended = 0;
      let total = 0;
      allUpdatedAtt.forEach(attLog => {
        const matchingRecord = attLog.records?.find(r => r.studentId === uid);
        if (matchingRecord) {
          total += 1;
          if (matchingRecord.status === 'present') attended += 1;
        }
      });
      user.totalLessons = total;
      user.attendedLessons = attended;
      user.attendance = total > 0 ? Math.round((attended / total) * 100) : 0;
      await setItem('users', user.uid, user);
    }
  }

  res.status(201).json({ id: logId, message: isUpdate ? 'Updated' : 'Created' });
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/feedback/:studentId', async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/submissions/group/:groupId', async (req, res) => {
  try {
  const { groupId } = req.params;
  const users = await getCollection('users');
  const submissions = await getCollection('submissions');
  const groupUsers = users.filter(u => u.groupId === groupId).map(u => u.uid);
  const filteredSubmissions = submissions.filter(s => groupUsers.includes(s.uid));
  res.json(filteredSubmissions);
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/submissions/:submissionId', async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
