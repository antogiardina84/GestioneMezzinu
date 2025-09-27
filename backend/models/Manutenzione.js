const mongoose = require('mongoose');

const manutenzioneSchema = new mongoose.Schema({
  autoveicolo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Autoveicolo',
    required: [true, 'L\'autoveicolo è obbligatorio']
  },
  tipoManutenzione: {
    type: String,
    enum: [
      'Ordinaria',
      'Straordinaria',
      'Preventiva',
      'Correttiva',
      'Revisione',
      'Tagliando',
      'Riparazione'
    ],
    required: [true, 'Il tipo di manutenzione è obbligatorio']
  },
  descrizione: {
    type: String,
    required: [true, 'La descrizione è obbligatoria'],
    maxlength: [1000, 'La descrizione non può superare 1000 caratteri']
  },
  dataProgrammata: {
    type: Date,
    required: [true, 'La data programmata è obbligatoria']
  },
  dataEsecuzione: {
    type: Date
  },
  stato: {
    type: String,
    enum: ['Programmata', 'In corso', 'Completata', 'Annullata', 'Rimandata'],
    default: 'Programmata'
  },
  priorita: {
    type: String,
    enum: ['Bassa', 'Media', 'Alta', 'Urgente'],
    default: 'Media'
  },
  chilometraggioEsecuzione: {
    type: Number,
    min: [0, 'Il chilometraggio non può essere negativo']
  },
  chilometraggioProgammato: {
    type: Number,
    min: [0, 'Il chilometraggio non può essere negativo']
  },
  fornitore: {
    nome: {
      type: String,
      required: [true, 'Il nome del fornitore è obbligatorio']
    },
    telefono: String,
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email non valida']
    },
    indirizzo: String,
    partitaIVA: String
  },
  costi: {
    manodopera: {
      type: Number,
      default: 0,
      min: [0, 'Il costo non può essere negativo']
    },
    ricambi: {
      type: Number,
      default: 0,
      min: [0, 'Il costo non può essere negativo']
    },
    altri: {
      type: Number,
      default: 0,
      min: [0, 'Il costo non può essere negativo']
    },
    iva: {
      type: Number,
      default: 22,
      min: [0, 'L\'IVA non può essere negativa'],
      max: [100, 'L\'IVA non può essere maggiore di 100%']
    }
  },
  ricambi: [{
    codice: String,
    descrizione: {
      type: String,
      required: [true, 'La descrizione del ricambio è obbligatoria']
    },
    quantita: {
      type: Number,
      required: [true, 'La quantità è obbligatoria'],
      min: [1, 'La quantità deve essere almeno 1']
    },
    prezzoUnitario: {
      type: Number,
      required: [true, 'Il prezzo unitario è obbligatorio'],
      min: [0, 'Il prezzo non può essere negativo']
    }
  }],
  note: {
    type: String,
    maxlength: [2000, 'Le note non possono superare 2000 caratteri']
  },
  prossimaScadenza: {
    data: Date,
    chilometraggio: Number,
    descrizione: String
  },
  allegati: [{
    nomeFile: String,
    percorsoFile: String,
    tipo: {
      type: String,
      enum: [
        'Fattura',
        'Preventivo',
        'Ricevuta',
        'Foto Prima',
        'Foto Dopo',
        'Scheda Tecnica',
        'Garanzia',
        'Altro'
      ]
    },
    dataCaricamento: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indici per migliorare le performance
manutenzioneSchema.index({ autoveicolo: 1 });
manutenzioneSchema.index({ stato: 1 });
manutenzioneSchema.index({ dataProgrammata: 1 });
manutenzioneSchema.index({ dataEsecuzione: 1 });
manutenzioneSchema.index({ priorita: 1 });
manutenzioneSchema.index({ tipoManutenzione: 1 });

// Virtual per costo totale
manutenzioneSchema.virtual('costoTotale').get(function () {
  const subtotale = this.costi.manodopera + this.costi.ricambi + this.costi.altri;
  const iva = subtotale * (this.costi.iva / 100);
  return subtotale + iva;
});

// Virtual per giorni dalla programmazione
manutenzioneSchema.virtual('giorniDallaProgrammazione').get(function () {
  const oggi = new Date();
  return Math.floor((oggi - this.dataProgrammata) / (1000 * 60 * 60 * 24));
});

// Middleware per aggiornare updatedBy
manutenzioneSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew && this.constructor._currentUser) {
    this.updatedBy = this.constructor._currentUser;
  }
  next();
});

module.exports = mongoose.model('Manutenzione', manutenzioneSchema);