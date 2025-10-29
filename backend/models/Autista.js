// backend/models/Autista.js
const mongoose = require('mongoose');

const autistaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome è obbligatorio'],
    trim: true,
    maxlength: [50, 'Il nome non può superare 50 caratteri']
  },
  cognome: {
    type: String,
    required: [true, 'Il cognome è obbligatorio'],
    trim: true,
    maxlength: [50, 'Il cognome non può superare 50 caratteri']
  },
  codiceFiscale: {
    type: String,
    required: [true, 'Il codice fiscale è obbligatorio'],
    trim: true,
    uppercase: true,
    unique: true,
    match: [/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/, 'Codice fiscale non valido']
  },
  dataNascita: {
    type: Date,
    required: [true, 'La data di nascita è obbligatoria']
  },
  luogoNascita: {
    type: String,
    trim: true
  },
  indirizzo: {
    via: String,
    citta: String,
    provincia: String,
    cap: String
  },
  contatti: {
    telefono: {
      type: String,
      required: [true, 'Il telefono è obbligatorio'],
      match: [/^[\d\s\-()]+$/, 'Numero di telefono non valido']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email non valida']
    },
    telefonoEmergenza: String,
    contattoEmergenza: String
  },
  patenti: [{
    tipo: {
      type: String,
      enum: ['AM', 'A1', 'A2', 'A', 'B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D1', 'D1E', 'D', 'DE', 'CQC'],
      required: true
    },
    numero: String,
    dataRilascio: Date,
    dataScadenza: {
      type: Date,
      required: true
    },
    enteRilascio: String,
    valida: {
      type: Boolean,
      default: true
    }
  }],
  qualifiche: [{
    tipo: {
      type: String,
      enum: ['ADR Base', 'ADR Cisterne', 'ADR Esplosivi', 'CQC Persone', 'CQC Merci', 'Muletto', 'Gru', 'Altro']
    },
    numero: String,
    dataRilascio: Date,
    dataScadenza: Date,
    note: String
  }],
  documenti: {
    cartaIdentita: {
      numero: String,
      dataRilascio: Date,
      dataScadenza: Date,
      enteRilascio: String
    },
    permessoSoggiorno: {
      numero: String,
      dataRilascio: Date,
      dataScadenza: Date,
      tipo: String
    }
  },
  contratto: {
    tipo: {
      type: String,
      enum: ['Tempo Indeterminato', 'Tempo Determinato', 'Apprendistato', 'Partita IVA', 'Collaborazione', 'Stagionale'],
      required: true
    },
    dataAssunzione: {
      type: Date,
      required: true
    },
    dataFineContratto: Date,
    orarioLavoro: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Turni']
    },
    livello: String,
    matricola: String
  },
  veicoliAbilitati: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Autoveicolo'
  }],
  categorieVeicoli: [{
    type: String,
    enum: ['Auto', 'Furgone', 'Camion', 'Autoarticolato', 'Motrice', 'Rimorchio', 'Autobus', 'Altro']
  }],
  stato: {
    type: String,
    enum: ['Attivo', 'In Ferie', 'Malattia', 'Sospeso', 'Cessato'],
    default: 'Attivo'
  },
  disponibilita: {
    lunedi: { type: Boolean, default: true },
    martedi: { type: Boolean, default: true },
    mercoledi: { type: Boolean, default: true },
    giovedi: { type: Boolean, default: true },
    venerdi: { type: Boolean, default: true },
    sabato: { type: Boolean, default: false },
    domenica: { type: Boolean, default: false }
  },
  note: {
    type: String,
    maxlength: [1000, 'Le note non possono superare 1000 caratteri']
  },
  allegati: [{
    tipo: {
      type: String,
      enum: ['Patente', 'Carta Identità', 'Codice Fiscale', 'Contratto', 'Certificato Medico', 'Qualifica', 'Altro']
    },
    nomeFile: String,
    percorsoFile: String,
    dataCaricamento: {
      type: Date,
      default: Date.now
    },
    dataScadenza: Date
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attivo: {
    type: Boolean,
    default: true
  },
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

// Indici
autistaSchema.index({ nome: 1, cognome: 1 });
autistaSchema.index({ codiceFiscale: 1 });
autistaSchema.index({ stato: 1 });
autistaSchema.index({ attivo: 1 });
autistaSchema.index({ 'contatti.telefono': 1 });
autistaSchema.index({ 'contatti.email': 1 });

// Virtual per nome completo
autistaSchema.virtual('nomeCompleto').get(function () {
  return `${this.nome} ${this.cognome}`;
});

// Virtual per età
autistaSchema.virtual('eta').get(function () {
  if (!this.dataNascita) return null;
  const oggi = new Date();
  const nascita = new Date(this.dataNascita);
  let eta = oggi.getFullYear() - nascita.getFullYear();
  const m = oggi.getMonth() - nascita.getMonth();
  if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) {
    eta--;
  }
  return eta;
});

// Metodo per verificare patenti in scadenza
autistaSchema.methods.verificaPatenteInScadenza = function (giorniAvviso = 30) {
  const oggi = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(oggi.getDate() + giorniAvviso);
  
  return this.patenti.filter(patente => {
    if (!patente.dataScadenza || !patente.valida) return false;
    const scadenza = new Date(patente.dataScadenza);
    return scadenza > oggi && scadenza <= dataLimite;
  });
};

// Metodo per verificare qualifiche in scadenza
autistaSchema.methods.verificaQualificheInScadenza = function (giorniAvviso = 30) {
  const oggi = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(oggi.getDate() + giorniAvviso);
  
  return this.qualifiche.filter(qualifica => {
    if (!qualifica.dataScadenza) return false;
    const scadenza = new Date(qualifica.dataScadenza);
    return scadenza > oggi && scadenza <= dataLimite;
  });
};

// Metodo per verificare se può guidare un veicolo
autistaSchema.methods.puoGuidareVeicolo = function (veicoloId) {
  if (!this.attivo || this.stato !== 'Attivo') return false;
  
  // Se non ci sono restrizioni, può guidare tutti
  if (!this.veicoliAbilitati || this.veicoliAbilitati.length === 0) return true;
  
  // Altrimenti verifica se è nella lista
  return this.veicoliAbilitati.some(v => v.toString() === veicoloId.toString());
};

// Metodo per verificare disponibilità giorno
autistaSchema.methods.isDisponibile = function (giorno) {
  // giorno: 0=domenica, 1=lunedì, ..., 6=sabato
  const giorni = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
  const nomeGiorno = giorni[giorno];
  return this.disponibilita[nomeGiorno] || false;
};

// Middleware pre-save
autistaSchema.pre('save', function (next) {
  // Valida patenti scadute
  if (this.patenti && this.patenti.length > 0) {
    const oggi = new Date();
    this.patenti.forEach(patente => {
      if (patente.dataScadenza && new Date(patente.dataScadenza) < oggi) {
        patente.valida = false;
      }
    });
  }
  
  // Aggiorna updatedBy
  if (this.isModified() && !this.isNew && this.constructor._currentUser) {
    this.updatedBy = this.constructor._currentUser;
  }
  
  next();
});

// Metodo statico per trovare autisti disponibili
autistaSchema.statics.trovaDisponibili = function (giorno, veicoloId = null) {
  const query = {
    attivo: true,
    stato: 'Attivo'
  };
  
  // Filtra per disponibilità giorno
  const giorni = ['disponibilita.domenica', 'disponibilita.lunedi', 'disponibilita.martedi', 
    'disponibilita.mercoledi', 'disponibilita.giovedi', 'disponibilita.venerdi', 
    'disponibilita.sabato'];
  query[giorni[giorno]] = true;
  
  // Se specificato veicolo, filtra per abilitazione
  if (veicoloId) {
    query.$or = [
      { veicoliAbilitati: { $size: 0 } },
      { veicoliAbilitati: veicoloId }
    ];
  }
  
  return this.find(query).select('nome cognome contatti.telefono');
};

module.exports = mongoose.model('Autista', autistaSchema);