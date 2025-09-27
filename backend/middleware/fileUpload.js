const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurazione storage migliorata
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let basePath = 'uploads';

    if (req.baseUrl.includes('autoveicoli')) {
      basePath = path.join(basePath, 'autoveicoli', req.params.id || 'common');
    } else if (req.baseUrl.includes('albo-gestori')) {
      basePath = path.join(basePath, 'albo-gestori', req.params.id || 'common');
    } else if (req.baseUrl.includes('ren')) {
      basePath = path.join(basePath, 'ren', req.params.id || 'common');
    } else if (req.baseUrl.includes('manutenzioni')) {
      basePath = path.join(basePath, 'manutenzioni', req.params.id || 'common');
    } else {
      basePath = path.join(basePath, 'altri');
    }

    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    console.error(`Upload destination: ${basePath}`);
    cb(null, basePath);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename =
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.error(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// Helper function CRUCIALE - VERSIONE CORRETTA
const normalizePathForUrl = (filePath) => {
  if (!filePath) return '';

  console.error(`🔧 Input path: "${filePath}"`);

  // IMPORTANTE: Converti SEMPRE tutti i backslash in forward slash
  let normalized = filePath.replace(/\\/g, '/');
  console.error(`🔧 After backslash replacement: "${normalized}"`);

  // Se non inizia con uploads/, aggiungilo
  if (!normalized.startsWith('uploads/')) {
    const uploadsIndex = normalized.indexOf('uploads');
    if (uploadsIndex >= 0) {
      normalized = normalized.substring(uploadsIndex);
    } else {
      normalized = `uploads/${normalized}`;
    }
  }

  // DOPPIO CONTROLLO: assicurati che non ci siano backslash rimasti
  normalized = normalized.replace(/\\/g, '/');

  console.error(`🔧 Final normalized path: "${normalized}"`);
  return normalized;
};

// Test della funzione (per debug)
const testNormalization = () => {
  const testPaths = [
    'uploads\\autoveicoli\\123\\file.pdf',
    'uploads/autoveicoli/123/file.pdf',
    'C:\\path\\uploads\\autoveicoli\\123\\file.pdf',
    'autoveicoli\\123\\file.pdf'
  ];

  console.error('🧪 Testing path normalization:');
  testPaths.forEach((testPath) => {
    const result = normalizePathForUrl(testPath);
    console.error(`  "${testPath}" -> "${result}"`);
  });
};

// Esegui il test in development
if (process.env.NODE_ENV === 'development') {
  testNormalization();
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Errore: Il file deve essere una immagine o un documento valido!');
    }
  }
});

exports.uploadFiles = upload.array('files', 10);
exports.uploadSingleFile = upload.single('file');
exports.normalizePathForUrl = normalizePathForUrl;

exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File troppo grande. Dimensione massima: 10MB'
      });
    }
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Errore durante il caricamento del file'
    });
  }

  next();
};
