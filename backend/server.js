/* eslint-disable no-console */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importazione delle routes
const authRoutes = require('./routes/auth');
const autoveicoliRoutes = require('./routes/autoveicoli');
const alboGestoriRoutes = require('./routes/alboGestori');
const renRoutes = require('./routes/ren');
const manutenzioniRoutes = require('./routes/manutenzioni');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
const serviziRoutes = require('./routes/servizi');
const autistiRoutes = require('./routes/autisti');

// Importazione middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Configurazione CORS - AGGIORNATA CON PORTE FRONTEND
const allowedOrigins = [
  // Backend
  'http://localhost:5555',
  'http://192.168.1.249:5555',
  'http://192.168.1.253:5555',
  'http://192.168.1.63:5555',
  
  // Frontend - Porta 3000 (default React)
  'http://localhost:3000',
  'http://192.168.1.249:3000',
  'http://192.168.1.253:3000',
  'http://192.168.1.63:3000',
  
  // Frontend - Porta 3001 (configurata nel tuo package.json)
  'http://localhost:3001',
  'http://192.168.1.249:3001',
  'http://192.168.1.253:3001',
  'http://192.168.1.63:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permetti richieste senza origin (tipo Postman, curl, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('⚠️ Origine bloccata da CORS:', origin);
      callback(new Error('Origine non permessa da CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

// Middleware di sicurezza
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path.includes('/api/auth/login') || req.path.includes('/uploads')
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================
// GESTIONE FILE STATICI - ACCESSO PUBBLICO
// ================================

app.use('/uploads', (req, res, next) => {
  console.log(`📁 Richiesta file statico: ${req.path}`);
  
  // Normalizza il path per evitare problemi con Windows/Linux
  const safePath = req.path.replace(/\\/g, '/');
  const fullPath = path.join(__dirname, 'uploads', safePath);
  
  // Verifica che il file esista
  if (fs.existsSync(fullPath)) {
    console.log(`✅ File trovato: ${fullPath}`);
  } else {
    console.log(`❌ File NON trovato: ${fullPath}`);
  }
  
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    console.log(`📤 Servendo file: ${filePath}`);
    
    // Imposta headers CORS per i file
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Imposta content-type appropriato
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);
    
    switch (ext) {
    case '.pdf':
      res.header('Content-Type', 'application/pdf');
      res.header('Content-Disposition', `inline; filename="${filename}"`);
      break;
    case '.jpg':
    case '.jpeg':
      res.header('Content-Type', 'image/jpeg');
      break;
    case '.png':
      res.header('Content-Type', 'image/png');
      break;
    case '.gif':
      res.header('Content-Type', 'image/gif');
      break;
    case '.doc':
      res.header('Content-Type', 'application/msword');
      res.header('Content-Disposition', `attachment; filename="${filename}"`);
      break;
    case '.docx':
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.header('Content-Disposition', `attachment; filename="${filename}"`);
      break;
    case '.xls':
      res.header('Content-Type', 'application/vnd.ms-excel');
      res.header('Content-Disposition', `attachment; filename="${filename}"`);
      break;
    case '.xlsx':
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.header('Content-Disposition', `attachment; filename="${filename}"`);
      break;
    default:
      res.header('Content-Type', 'application/octet-stream');
      res.header('Content-Disposition', `attachment; filename="${filename}"`);
      break;
    }
  }
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🗃️ MongoDB connesso'))
  .catch((err) => {
    console.error('❌ Errore connessione MongoDB:', err);
    process.exit(1);
  });

// Endpoint di test
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API server è raggiungibile',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    origin: req.headers.origin || 'unknown'
  });
});

// ================================
// ENDPOINT DI DEBUG SEMPLIFICATI
// ================================

app.get('/api/debug/file/:entityType/:entityId/:filename', (req, res) => {
  const { entityType, entityId, filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', entityType, entityId, filename);

  console.log(`🔍 Debug file check: ${filePath}`);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${entityType}/${entityId}/${filename}`;

    res.json({
      success: true,
      message: 'File trovato',
      path: filePath,
      url: fileUrl,
      exists: true,
      size: stats.size,
      modified: stats.mtime
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'File non trovato',
      path: filePath,
      exists: false
    });
  }
});

// Routes API (con middleware di autenticazione)
app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/autoveicoli', autoveicoliRoutes);
app.use('/api/albo-gestori', alboGestoriRoutes);
app.use('/api/ren', renRoutes);
app.use('/api/manutenzioni', manutenzioniRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/servizi', serviziRoutes);
app.use('/api/autisti', autistiRoutes);

// ===================================================
// SERVIRE IL FRONTEND BUILDATO - Aggiunta per Render
// ===================================================

// Serve la cartella build del frontend (modifica qui il path se necessario)
const frontendBuildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));

  // Per tutte le altre richieste che non corrispondono alle API, serve index.html
  app.get('*', (req, res, next) => {
    // Evita di interferire con le API e gli uploads
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  console.warn(`⚠️ Frontend build folder non trovata in: ${frontendBuildPath}`);
}

// Route principale (rimane per chiamate API dirette)
app.get('/', (req, res) => {
  res.json({
    message: 'Gestione mezzi Domus API',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api',
      uploads: '/uploads',
      debug: '/api/debug/file/:entityType/:entityId/:filename'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Resource not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Risorsa non trovata',
    path: req.originalUrl
  });
});

// Avvia server
const PORT = process.env.PORT || 5555;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server in esecuzione su http://${HOST}:${PORT}`);
  console.log(`🏠 Per accesso locale: http://localhost:${PORT}`);
  console.log(`🌐 Origini CORS consentite: ${allowedOrigins.join(', ')}`);

  // Verifica directory uploads
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log(`📁 Creazione directory uploads: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  console.log(`📂 Directory uploads: ${uploadsDir}`);

  console.log('✅ Server pronto!');
});

module.exports = app;