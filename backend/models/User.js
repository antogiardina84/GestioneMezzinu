const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome è obbligatorio'],
    trim: true
  },
  cognome: {
    type: String,
    required: [true, 'Il cognome è obbligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email è obbligatoria'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Per favore inserisci un\'email valida'
    ]
  },
  password: {
    type: String,
    required: [true, 'La password è obbligatoria'],
    minlength: 6,
    select: false // Non include la password nelle query di default
  },
  ruolo: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  attivo: {
    type: Boolean,
    default: true
  },
  ultimoAccesso: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware per criptare la password prima di salvare
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Metodo per generare il token JWT
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Metodo per confrontare le password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Metodo per generare il token di reset password
userSchema.methods.getResetPasswordToken = function () {
  // Genera il token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash del token e set al resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Virtual per ottenere il nome completo
userSchema.virtual('nomeCompleto').get(function () {
  return `${this.nome} ${this.cognome}`;
});

// Middleware per aggiornare l'ultimo accesso
userSchema.methods.updateLastAccess = function () {
  this.ultimoAccesso = Date.now();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);
