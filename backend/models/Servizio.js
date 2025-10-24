// backend/models/Servizio.js
const mongoose = require('mongoose');

const servizioSchema = new mongoose.Schema({
  titolo: {
    type: String,
    required: [true, 'Il titolo del servizio è obbligatorio'],
    trim: true,
    maxlength: [200, 'Il titolo non può superare 200 caratteri']
  },
  descrizione: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descrizione non può superare 1000 caratteri']
  },
  autoveicolo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Autoveicolo',
    required: [true, 'L\'autoveicolo è obbligatorio']
  },
  autista: {
    type: String,
    trim: true,
    required: [true, 'L\'autista è obbligatorio']
  },
  tipoServizio: {
    type: String,
    enum: [
      'Trasporto',
      'Raccolta',
      'Consegna',
      'Manutenzione',
      'Ispezione',
      'Altro'
    ],
    required: [true, 'Il tipo di servizio è obbligatorio']
  },
  dataInizio: {
    type: Date,
    required: [true, 'La data di inizio è obbligatoria']
  },
  dataFine: {
    type: Date,
    required: [true, 'La data di fine è obbligatoria'],
    validate: {
      validator: function (value) {
        return value >= this.dataInizio;
      },
      message: 'La data di fine deve essere successiva o uguale alla data di inizio'
    }
  },
  oraInizio: {
    type: String,
    required: [true, 'L\'ora di inizio è obbligatoria'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato ora non valido (HH:MM)']
  },
  oraFine: {
    type: String,
    required: [true, 'L\'ora di fine è obbligatoria'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato ora non valido (HH:MM)']
  },
  stato: {
    type: String,
    enum: ['Programmato', 'In corso', 'Completato', 'Annullato', 'Posticipato'],
    default: 'Programmato'
  },
  priorita: {
    type: String,
    enum: ['Bassa', 'Media', 'Alta', 'Urgente'],
    default: 'Media'
  },
  luogoPartenza: {
    indirizzo: String,
    citta: String,
    provincia: String,
    cap: String,
    coordinate: {
      lat: Number,
      lng: Number
    }
  },
  luogoArrivo: {
    indirizzo: String,
    citta: String,
    provincia: String,
    cap: String,
    coordinate: {
      lat: Number,
      lng: Number
    }
  },
  cliente: {
    nome: String,
    telefono: String,
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email non valida']
    },
    riferimento: String
  },
  chilometraggio: {
    iniziale: {
      type: Number,
      min: [0, 'Il chilometraggio non può essere negativo']
    },
    finale: {
      type: Number,
      min: [0, 'Il chilometraggio non può essere negativo'],
      validate: {
        validator: function (value) {
          if (this.chilometraggio && this.chilometraggio.iniziale && value) {
            return value >= this.chilometraggio.iniziale;
          }
          return true;
        },
        message: 'Il chilometraggio finale deve essere maggiore o uguale a quello iniziale'
      }
    },
    totale: {
      type: Number,
      default: 0
    }
  },
  carburante: {
    iniziale: {
      type: Number,
      min: [0, 'Il livello carburante non può essere negativo'],
      max: [100, 'Il livello carburante non può superare 100%']
    },
    finale: {
      type: Number,
      min: [0, 'Il livello carburante non può essere negativo'],
      max: [100, 'Il livello carburante non può superare 100%']
    },
    rifornimento: {
      effettuato: {
        type: Boolean,
        default: false
      },
      quantita: Number,
      costo: Number,
      stazione: String
    }
  },
  materiali: [{
    descrizione: String,
    quantita: Number,
    unitaMisura: String,
    peso: Number,
    note: String
  }],
  costi: {
    pedaggi: {
      type: Number,
      default: 0,
      min: [0, 'Il costo non può essere negativo']
    },
    parcheggi: {
      type: Number,
      default: 0,
      min: [0, 'Il costo non può essere negativo']
    },
    altri: {
      type: Number,
      default: 0,
      min: [0, 'Il costo non può essere negativo']
    }
  },
  note: {
    type: String,
    maxlength: [2000, 'Le note non possono superare 2000 caratteri']
  },
  noteCompletamento: {
    type: String,
    maxlength: [2000, 'Le note di completamento non possono superare 2000 caratteri']
  },
  allegati: [{
    nomeFile: String,
    percorsoFile: String,
    tipo: {
      type: String,
      enum: [
        'Documento Trasporto',
        'Bolla Consegna',
        'Foto Merce',
        'Ricevuta',
        'Contratto',
        'Autorizzazione',
        'Altro'
      ]
    },
    dataCaricamento: {
      type: Date,
      default: Date.now
    }
  }],
  ricorrenza: {
    attiva: {
      type: Boolean,
      default: false
    },
    frequenza: {
      type: String,
      enum: ['Giornaliera', 'Settimanale', 'Mensile', 'Personalizzata']
    },
    giornoSettimana: [{
      type: Number,
      min: 0,
      max: 6 // 0 = Domenica, 6 = Sabato
    }],
    giornoMese: {
      type: Number,
      min: 1,
      max: 31
    },
    dataFineRicorrenza: Date
  },
  completato: {
    type: Boolean,
    default: false
  },
  dataCompletamento: Date,
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
servizioSchema.index({ autoveicolo: 1 });
servizioSchema.index({ autista: 1 });
servizioSchema.index({ stato: 1 });
servizioSchema.index({ dataInizio: 1 });
servizioSchema.index({ dataFine: 1 });
servizioSchema.index({ tipoServizio: 1 });
servizioSchema.index({ priorita: 1 });
servizioSchema.index({ completato: 1 });

// Virtual per durata in ore
servizioSchema.virtual('durata').get(function () {
  const [oreInizio, minutiInizio] = this.oraInizio.split(':').map(Number);
  const [oreFine, minutiFine] = this.oraFine.split(':').map(Number);
  
  const minutiTotaliInizio = oreInizio * 60 + minutiInizio;
  const minutiTotaliFine = oreFine * 60 + minutiFine;
  
  const differenzaMinuti = minutiTotaliFine - minutiTotaliInizio;
  
  return {
    ore: Math.floor(differenzaMinuti / 60),
    minuti: differenzaMinuti % 60,
    totaleMinuti: differenzaMinuti
  };
});

// Virtual per costo totale
servizioSchema.virtual('costoTotale').get(function () {
  let totale = this.costi.pedaggi + this.costi.parcheggi + this.costi.altri;
  
  if (this.carburante && this.carburante.rifornimento && this.carburante.rifornimento.effettuato) {
    totale += this.carburante.rifornimento.costo || 0;
  }
  
  return totale;
});

// Middleware pre-save per calcolare chilometraggio totale
servizioSchema.pre('save', function (next) {
  if (this.chilometraggio && this.chilometraggio.iniziale && this.chilometraggio.finale) {
    this.chilometraggio.totale = this.chilometraggio.finale - this.chilometraggio.iniziale;
  }
  
  // Imposta data completamento se stato è completato
  if (this.stato === 'Completato' && !this.dataCompletamento) {
    this.dataCompletamento = new Date();
    this.completato = true;
  }
  
  // Aggiorna updatedBy se disponibile
  if (this.isModified() && !this.isNew && this.constructor._currentUser) {
    this.updatedBy = this.constructor._currentUser;
  }
  
  next();
});

// Metodo per verificare conflitti di calendario
servizioSchema.methods.verificaConflitti = async function () {
  const Servizio = this.constructor;
  
  const conflitti = await Servizio.find({
    _id: { $ne: this._id },
    stato: { $nin: ['Annullato', 'Completato'] },
    $and: [
      {
        $or: [
          { autoveicolo: this.autoveicolo },
          { autista: this.autista }
        ]
      },
      {
        dataInizio: { $lte: this.dataFine },
        dataFine: { $gte: this.dataInizio }
      }
    ]
  }).populate('autoveicolo', 'targa marca modello');
  
  return conflitti;
};

// Metodo per generare servizi ricorrenti
servizioSchema.methods.generaServiziRicorrenti = async function (numeroOccorrenze = 10) {
  if (!this.ricorrenza || !this.ricorrenza.attiva) {
    return [];
  }
  
  const Servizio = this.constructor;
  const serviziGenerati = [];
  
  let dataCorrente = new Date(this.dataInizio);
  const durataServizio = this.dataFine - this.dataInizio;
  
  for (let i = 0; i < numeroOccorrenze; i++) {
    // Calcola prossima data in base alla frequenza
    switch (this.ricorrenza.frequenza) {
    case 'Giornaliera':
      dataCorrente.setDate(dataCorrente.getDate() + 1);
      break;
    case 'Settimanale':
      dataCorrente.setDate(dataCorrente.getDate() + 7);
      break;
    case 'Mensile':
      dataCorrente.setMonth(dataCorrente.getMonth() + 1);
      break;
    }
    
    // Verifica se supera la data fine ricorrenza
    if (this.ricorrenza.dataFineRicorrenza && dataCorrente > this.ricorrenza.dataFineRicorrenza) {
      break;
    }
    
    const nuovoServizio = new Servizio({
      ...this.toObject(),
      _id: undefined,
      dataInizio: new Date(dataCorrente),
      dataFine: new Date(dataCorrente.getTime() + durataServizio),
      stato: 'Programmato',
      completato: false,
      dataCompletamento: undefined,
      allegati: [],
      createdAt: undefined,
      updatedAt: undefined
    });
    
    serviziGenerati.push(nuovoServizio);
  }
  
  return serviziGenerati;
};

module.exports = mongoose.model('Servizio', servizioSchema);