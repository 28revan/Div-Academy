import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { getCollection, setItem, readDB, writeDB, addLog } from '../dataService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lms-secret-key-123';

// Brute Force qorunması üçün spesifik Limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dəqiqə
  max: 5, // Hər IP üçün max 5 cəhd
  message: { error: 'Həddindən artıq yanlış giriş cəhdi. 15 dəqiqə sonra yenidən cəhd edin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Zod ilə Strict Validation
const loginSchema = z.object({
  email: z.string().email("Keçərli e-poçt daxil edin"),
  password: z.string().min(6, "Şifrə ən az 6 simvol olmalıdır").max(100)
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    // 1. Validasiya və Sanitizasiya
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;
    
    const users = await getCollection('users');
    let user = users.find((u) => u.email === email);
    
    // Sistem Admini üçün Master Check (Testing purposes - Productionda çıxarılmalıdır)
    if (!user && email === 'revaneliyev133@gmail.com' && password === 'revan28@!') {
       user = {
         uid: Date.now().toString(),
         name: 'Revan Eliyev',
         email: email,
         passwordHash: await bcrypt.hash(password, 12), // 12 round ilə daha təhlükəsiz hash
         role: 'Admin',
         status: 'Aktiv',
         createdAt: new Date().toISOString()
       };
       await setItem('users', user.uid, user);
    }
  
    // 2. Hesab Dondurma (Account Lockout) Yoxlanışı və Doğrulama
    if (!user || user.status === 'Locked') {
      return res.status(401).json({ error: 'Hesab dondurulub və ya tapılmadı' });
    }
  
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      // Burada gələcək inkişafda səhv cəhdləri saya və statusu 'Locked' edə bilərsiniz
      return res.status(401).json({ error: 'Daxil etdiyiniz E-poçt və ya şifrə yanlışdır' });
    }
    
    // 3. Uğurlu giriş - Məlumatların yenilənməsi
    user.lastLogin = new Date().toISOString();
    await setItem('users', user.uid, user);
    await addLog(user, 'Login', 'Sistemə giriş edildi');
    
    // 4. Təhlükəsiz Token Yaranması
    const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    
    // 5. Tokenin HttpOnly, Secure cookie vasitəsilə göndərilməsi (XSS-ə qarşı)
    res.cookie('token', token, {
      httpOnly: true, // XSS hücumlarını əngəlləyir
      secure: process.env.NODE_ENV === 'production', // HTTPS üzərindən şifrələmə
      sameSite: 'strict', // CSRF hücumlarını əngəlləyir
      maxAge: 8 * 60 * 60 * 1000 // 8 saat
    });
  
    res.json({ user: { uid: user.uid, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Route Error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Server xətası: ' + error.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
  const { currentPassword, newPassword, userId } = req.body;
  const users = await getCollection('users');
  const user = users.find(u => u.uid === userId);

  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return res.status(401).json({ message: 'Cari şifrə yanlışdır' });
  }

  // Check limits
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (!user.passwordChangeHistory || !Array.isArray(user.passwordChangeHistory)) {
    user.passwordChangeHistory = [];
  }

  const changesThisMonth = user.passwordChangeHistory.filter(change => {
    const d = new Date(change);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  if (changesThisMonth.length >= 3) {
    return res.status(429).json({ message: 'Şifrəni ayda maksimum 3 dəfə dəyişmək olar' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordChangeHistory.push(now.toISOString());
  
  await addLog(user, 'Admin', 'İstifadəçi öz şifrəsini dəyişdi');
  
  await setItem('users', user.uid, user);
  res.json({ message: 'Şifrə uğurla dəyişdirildi' });
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
