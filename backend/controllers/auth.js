const crypto = require('crypto');
const User = require('../models/User');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { nome, cognome, email, password, ruolo } = req.body;

  try {
    // Create user
    const user = await User.create({
      nome,
      cognome,
      email,
      password,
      ruolo
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Log request info per debugging
  console.error(`Login tentativo da IP: ${req.ip} per email: ${email}`);

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Per favore inserisci email e password'
    });
  }

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.error(`Login fallito: utente non trovato (${email})`);
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.error(`Login fallito: password errata (${email})`);
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    console.error(`Login riuscito per: ${email}`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(`Errore durante login: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  const fieldsToUpdate = {
    nome: req.body.nome,
    cognome: req.body.cognome,
    email: req.body.email
  };

  try {
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Password corrente non valida'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Non esiste nessun utente con questa email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url

    // Variabile per messaggio email (mantiene la logica originale)

    try {
      // Qui dovresti inviare l'email
      // await sendEmail({
      //   email: user.email,
      //   subject: 'Token di reset password',
      //   message: emailMessage
      // });

      res.status(200).json({
        success: true,
        data: 'Email inviata',
        // Per development, includiamo il token
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email non può essere inviata'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token non valido'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    path: '/',
    sameSite: 'lax' // Permette richieste cross-site in alcuni casi
  };

  // In development, allow HTTP
  if (process.env.NODE_ENV === 'development') {
    options.secure = false;
  } else {
    options.secure = true; // Solo HTTPS in produzione
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        ruolo: user.ruolo
      }
    });
};
