const mongoose = require('mongoose');

const alboGestoriSchema = new mongoose.Schema({
  numeroIscrizioneAlbo: {
    type: String,
    required: [true, 'Il numero di iscrizione è obbligatorio'],
    unique: true,
    trim: true
  },
  categoria: {
    type: String,
    required: [true, 'La categoria è obbligatoria'],
    enum: ['1', '4', '5', '8', '9', '10']
  },
  classe: {
    type: String,
    required: [true, 'La classe è obbligatoria'],
    enum: ['A', 'B', 'C', 'D', 'E', 'F']
  },
  dataIscrizione: {
    type: Date,
    required: [true, 'La data di iscrizione è obbligatoria']
  },
  dataScadenzaIscrizione: {
    type: Date,
    required: [true, 'La data di scadenza è obbligatoria']
  },
  allegati: [
    {
      nomeFile: String,
      percorsoFile: String,
      tipo: String,
      dataCaricamento: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indici per migliorare le performance
alboGestoriSchema.index({ dataScadenzaIscrizione: 1 });

// Middleware per aggiornare il campo updatedAt
alboGestoriSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Metodo per verificare se l'iscrizione sta per scadere
alboGestoriSchema.methods.inScadenza = function () {
  const oggi = new Date();
  const seiMesi = new Date(oggi.getTime() + 180 * 24 * 60 * 60 * 1000);
  const treMesi = new Date(oggi.getTime() + 90 * 24 * 60 * 60 * 1000);

  return {
    seiMesi: this.dataScadenzaIscrizione < seiMesi,
    treMesi: this.dataScadenzaIscrizione < treMesi
  };
};

// Virtual per formattare la categoria completa
alboGestoriSchema.virtual('categoriaCompleta').get(function () {
  return `Categoria ${this.categoria} - Classe ${this.classe}`;
});

module.exports = mongoose.model('AlboGestori', alboGestoriSchema);
