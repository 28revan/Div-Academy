import express from 'express';
import helmet from 'helmet';
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

export const app = express();

// Initialization helper
const initializeApp = async () => {
  try {
    await initDB();
    await seedDB();
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '1mb' }));

// Ensure API responses are ALWAYS JSON and don't cache
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', teacherRoutes);

// Server-side CV Generation (Senior Security Implementation)
app.post('/api/cv/generate', async (req, res) => {
  try {
    const { cvData, user, projects } = req.body;
    
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

// Global API error handler
app.use('/api', (err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Daxili server xətası',
    path: req.path
  });
});

// Static files and Vite integration
if (process.env.NODE_ENV !== 'production') {
  // Dynamic import for Vite to avoid production dependency issues
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  
  // SPA fallback for non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API marşrutu tapılmadı' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Startup
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  await initializeApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
} else {
  // On Vercel, initialization happens when the function is first called
  // and we don't call app.listen
  await initializeApp();
}

export default app;
