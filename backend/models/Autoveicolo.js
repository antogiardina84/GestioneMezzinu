// backend/models/Autoveicolo.js - VERSIONE AGGIORNATA CON PASS ZTL
const mongoose = require('mongoose');

const AllegatoSchema = new mongoose.Schema({
  nomeFile: {
    type: String,
    required: true
  },
  percorsoFile: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    required: true
  },
  dataCaricamento: {
    type: Date,
    default: Date.now
  }
});

const AutoveicoloSchema = new mongoose.Schema({
  marca: {
    type: String,
    required: [true, 'La marca è obbligatoria'],
    trim: true
  },
  modello: {
    type: String,
    required: [true, 'Il modello è obbligatorio'],
    trim: true
  },
  cilindrata: {
    type: Number,
    default: 0,
    min: [0, 'La cilindrata non può essere negativa'],
    validate: {
      validator: function (value) {
        if (
          [
            'Semirimorchio',
            'Rimorchio < 3.5 ton',
            'Rimorchio > 3.5 ton'
          ].includes(this.tipoCarrozzeria)
        ) {
          return value >= 0;
        }
        return value >= 0;
      },
      message: 'La cilindrata deve essere maggiore di 0 per i veicoli a motore'
    }
  },
  kw: {
    type: Number,
    default: 0,
    min: [0, 'I Kw non possono essere negativi'],
    validate: {
      validator: function (value) {
        if (
          [
            'Semirimorchio',
            'Rimorchio < 3.5 ton',
            'Rimorchio > 3.5 ton'
          ].includes(this.tipoCarrozzeria)
        ) {
          return value >= 0;
        }
        return value >= 0;
      },
      message: 'I Kw devono essere maggiori di 0 per i veicoli a motore'
    }
  },
  targa: {
    type: String,
    required: [true, 'La targa è obbligatoria'],
    unique: true,
    uppercase: true,
    trim: true
  },
  tipoCarrozzeria: {
    type: String,
    required: [true, 'Il tipo di carrozzeria è obbligatorio'],
    enum: [
      'Cassonato',
      'Van',
      'Autovettura',
      'Trattore stradale < 3.5 ton',
      'Trattore stradale > 3.5 ton',
      'Semirimorchio',
      'Rimorchio < 3.5 ton',
      'Rimorchio > 3.5 ton'
    ]
  },
  tipologiaAcquisto: {
    type: String,
    required: [true, 'La tipologia di acquisto è obbligatoria'],
    enum: ['Proprietà', 'Leasing', 'Noleggio']
  },
  scadenzaTitoloProprietà: {
    type: Date,
    required: function () {
      return ['Leasing', 'Noleggio'].includes(this.tipologiaAcquisto);
    }
  },
  dataImmatricolazione: {
    type: Date,
    required: [true, 'La data di immatricolazione è obbligatoria']
  },
  ultimaRevisione: {
    type: Date
  },
  dataScadenzaBollo: {
    type: Date,
    required: function () {
      return !this.esenteBollo;
    }
  },
  esenteBollo: {
    type: Boolean,
    default: false
  },
  compagniaAssicurazione: {
    type: String,
    required: [true, 'La compagnia di assicurazione è obbligatoria']
  },
  numeroPolizzaAssicurazione: {
    type: String,
    required: [true, 'Il numero di polizza assicurazione è obbligatorio']
  },
  dataInizioAssicurazione: {
    type: Date,
    required: [true, 'La data di inizio assicurazione è obbligatoria']
  },
  dataScadenzaAssicurazione: {
    type: Date,
    required: [true, 'La data di scadenza assicurazione è obbligatoria']
  },
  iscrizioneANGA: [{
    type: String
  }],
  stato: {
    type: String,
    enum: ['Attivo', 'Chiuso', 'Venduto', 'Demolito', 'Veicolo Guasto'],
    default: 'Attivo'
  },
  allegati: [AllegatoSchema],
  datiDemolizione: {
    datiDemolitore: String,
    dataDemolizione: Date
  },
  telaio: {
    type: String,
    trim: true
  },
  autista: {
    type: String,
    trim: true
  },
  portataMax: {
    type: Number,
    min: [0, 'La portata massima non può essere negativa']
  },
  autCat1: {
    type: String,
    trim: true
  },
  autCat2: {
    type: String,
    trim: true
  },
  autCat3: {
    type: String,
    trim: true
  },
  passZTL: {
    type: Boolean,
    default: false
  },
  // NUOVO CAMPO: Data scadenza Pass ZTL
  dataScadenzaPassZTL: {
    type: Date,
    required: function () {
      // La data di scadenza è obbligatoria solo se il Pass ZTL è attivo
      return this.passZTL === true;
    }
  },
  autRifiuti: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AlboGestori'
  }],
  note: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Metodo per determinare gli intervalli di revisione
AutoveicoloSchema.methods.getIntervallorevisione = function () {
  const tipiRevisioneAnnuale = [
    'Trattore stradale > 3.5 ton',
    'Semirimorchio',
    'Rimorchio > 3.5 ton'
  ];
  
  if (tipiRevisioneAnnuale.includes(this.tipoCarrozzeria)) {
    return { primaRevisione: 1, revisioniSuccessive: 1 };
  }
  return { primaRevisione: 4, revisioniSuccessive: 2 };
};

// Metodo per verificare se il veicolo ha un motore
AutoveicoloSchema.methods.isMotorVehicle = function () {
  return !['Semirimorchio', 'Rimorchio < 3.5 ton', 'Rimorchio > 3.5 ton'].includes(this.tipoCarrozzeria);
};

// Middleware pre-save per validazione condizionale
AutoveicoloSchema.pre('save', function (next) {
  // Validazione condizionale per cilindrata e kw
  if (this.isMotorVehicle()) {
    if (this.cilindrata <= 0) {
      return next(new Error('La cilindrata deve essere maggiore di 0 per i veicoli a motore'));
    }
    if (this.kw <= 0) {
      return next(new Error('I Kw devono essere maggiori di 0 per i veicoli a motore'));
    }
  } else {
    this.cilindrata = 0;
    this.kw = 0;
  }

  // Validazione per scadenza titolo proprietà
  if (['Leasing', 'Noleggio'].includes(this.tipologiaAcquisto) && !this.scadenzaTitoloProprietà) {
    return next(new Error('La scadenza del titolo di proprietà è obbligatoria per Leasing/Noleggio'));
  }

  // Validazione per bollo
  if (!this.esenteBollo && !this.dataScadenzaBollo) {
    return next(new Error('La data di scadenza del bollo è obbligatoria per veicoli non esenti'));
  }

  if (this.esenteBollo) {
    this.dataScadenzaBollo = undefined;
  }

  // NUOVA VALIDAZIONE: Pass ZTL e data scadenza
  if (this.passZTL && !this.dataScadenzaPassZTL) {
    return next(new Error('La data di scadenza del Pass ZTL è obbligatoria quando il Pass ZTL è attivo'));
  }

  // Se il Pass ZTL non è attivo, rimuovi la data scadenza
  if (!this.passZTL) {
    this.dataScadenzaPassZTL = undefined;
  }

  next();
});

// Middleware pre-update per validazione condizionale
AutoveicoloSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  
  if (update.tipoCarrozzeria) {
    const isMotor = !['Semirimorchio', 'Rimorchio < 3.5 ton', 'Rimorchio > 3.5 ton'].includes(update.tipoCarrozzeria);
    
    if (!isMotor) {
      update.cilindrata = 0;
      update.kw = 0;
    }
  }

  // Gestione esenzione bollo
  if (update.esenteBollo === true) {
    update.dataScadenzaBollo = undefined;
  }

  // NUOVA GESTIONE: Pass ZTL
  if (update.passZTL === false) {
    // Se si disattiva il Pass ZTL, rimuovi la data scadenza
    update.dataScadenzaPassZTL = undefined;
  }

  next();
});

// Indici per migliorare le performance
AutoveicoloSchema.index({ targa: 1 });
AutoveicoloSchema.index({ stato: 1 });
AutoveicoloSchema.index({ tipoCarrozzeria: 1 });
AutoveicoloSchema.index({ dataScadenzaBollo: 1 });
AutoveicoloSchema.index({ dataScadenzaAssicurazione: 1 });
AutoveicoloSchema.index({ dataScadenzaPassZTL: 1 }); // Nuovo indice per Pass ZTL
AutoveicoloSchema.index({ passZTL: 1 }); // Nuovo indice per Pass ZTL
AutoveicoloSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Autoveicolo', AutoveicoloSchema);