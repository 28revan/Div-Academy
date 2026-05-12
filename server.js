import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { initDB } from './server/dataService.js';

// Routes
import authRoutes from './server/routes/auth.js';
import adminRoutes from './server/routes/admin.js';
import teacherRoutes from './server/routes/teacher.js';
import studentRoutes from './server/routes/student.js';
import { generateCVBuffer } from './server/cvService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

export const app = express();
app.set('trust proxy', 1);

// SECURITY: Disable X-Powered-By header to prevent technology fingerprinting
app.disable('x-powered-by');

// SECURITY: Global Rate Limiting (DDoS qorunması üçün. Hər IP-dən 15 dəqiqə ərzində max 1000 sorğu)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000,
  message: 'Həddindən artıq sorğu göndərilib. Zəhmət olmasa biraz sonra yenidən cəhd edin.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// SECURITY: Global Rate Limiting
// Xüsusi xəta idarə olunmasını asanlaşdırmaq üçün
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// SECURITY: Təhlükəsiz cookie'lərin oxunması üçün
app.use(cookieParser());

// Initialization singleton
let isInitialized = false;
const initializeApp = async () => {
  if (isInitialized) return;
  try {
    await initDB();
    isInitialized = true;
    console.log('Database initialized successfully');
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

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Initialization middleware for Vercel/Serverless
app.use(async (req, res, next) => {
  if (!isInitialized) {
    await initializeApp();
  }
  next();
});

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

// API routes matched, anything else starting with /api is a 404 JSON
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API marşrutu tapılmadı', path: req.path });
});

async function startServer() {
  // Static files and Vite integration
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error('Failed to initialize Vite middleware:', viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA fallback for non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Startup
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

export default app;
startServer().catch(err => {
  console.error("FATAL ERROR IN startServer:", err);
  process.exit(1);
});
