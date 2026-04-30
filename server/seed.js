import bcrypt from 'bcryptjs';
import { readDB, writeDB } from './dataService.js';

export async function seedDB() {
  const data = await readDB();
  
  if (data.users.length > 0) return; // Already seeded

  console.log('Seeding database...');
  
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const trainerPasswordHash = await bcrypt.hash('teacher123', 10);
  const mentorPasswordHash = await bcrypt.hash('mentor123', 10);
  const studentPasswordHash = await bcrypt.hash('student123', 10);

  // Admin
  data.users.push({
    uid: 'admin-1',
    name: 'System Admin',
    email: 'admin@div.edu.az',
    passwordHash: adminPasswordHash,
    role: 'Admin',
    status: 'Aktiv',
    paymentStatus: 'Paid',
    balance: 0,
    passwordChangeHistory: [],
    createdAt: new Date().toISOString()
  });
  
  // Trainers
  data.users.push(
    {
      uid: 't-1',
      name: 'Murad Səfərov',
      email: 'trainer1@div.edu.az',
      passwordHash: trainerPasswordHash,
      role: 'Teacher',
      status: 'Aktiv',
      passwordChangeHistory: [],
      createdAt: new Date().toISOString()
    },
    {
      uid: 't-2',
      name: 'Leyla Bağırova',
      email: 'trainer2@div.edu.az',
      passwordHash: trainerPasswordHash,
      role: 'Teacher',
      status: 'Aktiv',
      passwordChangeHistory: [],
      createdAt: new Date().toISOString()
    }
  );

  // Mentors
  data.users.push(
    {
      uid: 'm-1',
      name: 'Zaur Paşayev',
      email: 'mentor1@div.edu.az',
      passwordHash: mentorPasswordHash,
      role: 'Mentor',
      status: 'Aktiv',
      passwordChangeHistory: [],
      createdAt: new Date().toISOString()
    },
    {
      uid: 'm-2',
      name: 'Fidan Quliyeva',
      email: 'mentor2@div.edu.az',
      passwordHash: mentorPasswordHash,
      role: 'Mentor',
      status: 'Aktiv',
      passwordChangeHistory: [],
      createdAt: new Date().toISOString()
    }
  );

  // Students
  const firstNames = ['Elvin', 'Aysel', 'Nigar', 'Orxan', 'Zaur', 'Leyla', 'Murad', 'Səbinə', 'Tural', 'Günay'];
  const lastNames = ['Məmmədov', 'Hüseynova', 'Əliyeva', 'Qasımov', 'Bağırov', 'Səfərova', 'Rzayev', 'Kərimova', 'Piriyev', 'Tağıyeva'];
  
  for(let i=0; i < 20; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    
    data.users.push({
      uid: `s-${i}`,
      name: `${fName} ${lName}`,
      email: `student${i}@div.edu.az`,
      passwordHash: studentPasswordHash,
      role: 'Student',
      status: 'Aktiv',
      balance: 0,
      scholarship: `${[0, 20, 50, 100][i % 4]}%`,
      attendance: 85 + (i % 15), // Random attendance for seed
      totalLessons: 40,
      attendedLessons: Math.floor(40 * (0.85 + (i % 15) / 100)),
      groupId: i < 5 ? 'g-1' : 'g-2',
      projects: [],
      passwordChangeHistory: [],
      createdAt: new Date().toISOString()
    });
  }

  // Groups
  data.groups.push(
    {
      id: 'g-1',
      name: 'Fullstack Proqramlaşdırma',
      teacherId: 't-1',
      mentorId: 'm-1',
      students: data.users.filter(u => u.groupId === 'g-1').map(u => u.uid),
      progress: 35,
      avgGrade: 82,
      health: 'Healthy',
      tasks: [],
      schedule: { days: ['B.e.', 'C.a.'], time: '19:00 - 21:00' }
    },
    {
      id: 'g-2',
      name: 'Data Science',
      teacherId: 't-2',
      mentorId: 'm-2',
      students: data.users.filter(u => u.groupId === 'g-2').map(u => u.uid),
      progress: 20,
      avgGrade: 75,
      health: 'At Risk',
      tasks: [],
      schedule: { days: ['Çərş.', 'C.a.'], time: '19:00 - 21:00' }
    }
  );

  await writeDB(data);
  console.log('Database seeded successfully.');
}
