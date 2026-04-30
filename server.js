import express from 'express';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './server/dataService.js';
import { seedDB } from './server/seed.js';

// Routes
import authRoutes from './server/routes/auth.js';
import adminRoutes from './server/routes/admin.js';
import teacherRoutes from './server/routes/teacher.js';
import studentRoutes from './server/routes/student.js';
import { generateCVBuffer } from './server/cvService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

async function startServer() {
  await initDB();
  await seedDB();

  const app = express();
  
  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false
  }));
  app.use(express.json({ limit: '1mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api', teacherRoutes); // teacherRoutes paths already include /tasks, /attendance, etc.

  // Server-side CV Generation (Senior Security Implementation)
  app.post('/api/cv/generate', async (req, res) => {
    try {
      const { cvData, user, projects } = req.body;
      
      // Basic protection against empty payloads
      if (!user || !user.name) {
         return res.status(400).json({ error: 'Tam məlumat təmin edilməyib' });
      }

      const buffer = await generateCVBuffer(cvData, user, projects);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(user.name)}_CV.docx"`);
      res.send(buffer);
    } catch (error) {
      console.error('CV Generation Error:', error);
      res.status(500).json({ error: 'Server tərəfində sənəd yaradılarkən xəta baş verdi' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
