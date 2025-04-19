const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Türkçe karakter dönüşüm fonksiyonu
function normalizeFileName(fileName) {
  return decodeURIComponent(fileName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invoice-uploader', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch((err) => console.error('MongoDB bağlantı hatası:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: String,
  originalName: String,
  path: String,
  uploadDate: { type: Date, default: Date.now },
  fileType: String,
  ocrData: {
    faturaNo: String,
    faturaTarihi: String,
    faturaTipi: String,
    tutar: String,
    kategori: String
  }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email veya kullanıcı adı zaten kullanımda' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu' });
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcı oluşturulurken bir hata oluştu' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Geçersiz email veya şifre' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Geçersiz email veya şifre' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Giriş yapılırken bir hata oluştu' });
  }
});

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const normalizedName = normalizeFileName(originalName);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + normalizedName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Hata: Sadece .pdf, .jpeg, .jpg ve .png dosyaları yüklenebilir!');
    }
  }
});

// Protected Routes
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenemedi.' });
    }

    const originalName = req.file.originalname;
    
    const pythonProcess = spawn('python', ['ocr/CapstoneV1/Capstone.py', req.file.path], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', LANG: 'tr_TR.UTF-8' }
    });
    
    let ocrOutput = '';
    let errorOutput = '';

    pythonProcess.stdout.setEncoding('utf8');
    pythonProcess.stderr.setEncoding('utf8');

    pythonProcess.stdout.on('data', (data) => {
      ocrOutput += data;
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data;
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('OCR işlemi hatası:', errorOutput);
        return res.status(500).json({ message: 'OCR işlemi sırasında bir hata oluştu.' });
      }

      try {
        const ocrData = JSON.parse(ocrOutput);
        
        const invoice = new Invoice({
          userId: req.user.userId,
          filename: req.file.filename,
          originalName: originalName,
          path: req.file.path,
          fileType: path.extname(originalName).toLowerCase(),
          ocrData: ocrData
        });

        await invoice.save();
        res.json({ message: 'Dosya başarıyla yüklendi ve işlendi.', invoice });
      } catch (parseError) {
        console.error('OCR verisi ayrıştırma hatası:', parseError);
        res.status(500).json({ message: 'OCR verisi işlenirken bir hata oluştu.' });
      }
    });
  } catch (error) {
    console.error('Yükleme hatası:', error);
    res.status(500).json({ message: 'Dosya yüklenirken bir hata oluştu.' });
  }
});

app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.userId }).sort({ uploadDate: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('Fatura listesi alınırken hata:', error);
    res.status(500).json({ message: 'Faturalar alınırken bir hata oluştu.' });
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 