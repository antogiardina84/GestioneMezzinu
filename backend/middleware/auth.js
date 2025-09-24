const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protegge le route e verifica se l'utente è loggato
exports.protect = async (req, res, next) => {
  let token;

  console.log('Auth middleware - Headers:', {
    authorization: req.headers.authorization,
    hasCookie: !!req.cookies.token
  });

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
    console.log(
      'Token estratto da Authorization header:',
      token.substring(0, 10) + '...'
    );
  }
  // Set token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
    console.log('Token estratto da cookie:', token.substring(0, 10) + '...');
  }

  // Make sure token exists
  if (!token) {
    console.log('Nessun token trovato nella richiesta');
    return res.status(401).json({
      success: false,
      message: 'Non autorizzato ad accedere a questa route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verificato con successo per utente ID:', decoded.id);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log('Utente non trovato con ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    next();
  } catch (err) {
    console.log('Errore verifica token:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Non autorizzato ad accedere a questa route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.ruolo)) {
      return res.status(403).json({
        success: false,
        message: `Il ruolo ${req.user.ruolo} non è autorizzato ad accedere a questa route`
      });
    }
    next();
  };
};

// Controlla se l'utente è ancora attivo
exports.checkActiveUser = async (req, res, next) => {
  if (!req.user.attivo) {
    return res.status(403).json({
      success: false,
      message: 'Il tuo account è stato disattivato. Contatta admin'
    });
  }
  next();
};

// Middleware per aggiornare l'ultimo accesso
exports.updateLastAccess = async (req, res, next) => {
  if (req.user) {
    await req.user.updateLastAccess();
  }
  next();
};
