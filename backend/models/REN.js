const mongoose = require('mongoose');

// Schema per le regioni e province italiane
const regioniProvince = {
  Abruzzo: ['Chieti', "L'Aquila", 'Pescara', 'Teramo'],
  Basilicata: ['Matera', 'Potenza'],
  Calabria: [
    'Catanzaro',
    'Cosenza',
    'Crotone',
    'Reggio Calabria',
    'Vibo Valentia'
  ],
  Campania: ['Avellino', 'Benevento', 'Caserta', 'Napoli', 'Salerno'],
  'Emilia-Romagna': [
    'Bologna',
    'Ferrara',
    'Forlì-Cesena',
    'Modena',
    'Parma',
    'Piacenza',
    'Ravenna',
    'Reggio Emilia',
    'Rimini'
  ],
  'Friuli-Venezia Giulia': ['Gorizia', 'Pordenone', 'Trieste', 'Udine'],
  Lazio: ['Frosinone', 'Latina', 'Rieti', 'Roma', 'Viterbo'],
  Liguria: ['Genova', 'Imperia', 'La Spezia', 'Savona'],
  Lombardia: [
    'Bergamo',
    'Brescia',
    'Como',
    'Cremona',
    'Lecco',
    'Lodi',
    'Mantova',
    'Milano',
    'Monza e Brianza',
    'Pavia',
    'Sondrio',
    'Varese'
  ],
  Marche: ['Ancona', 'Ascoli Piceno', 'Fermo', 'Macerata', 'Pesaro e Urbino'],
  Molise: ['Campobasso', 'Isernia'],
  Piemonte: [
    'Alessandria',
    'Asti',
    'Biella',
    'Cuneo',
    'Novara',
    'Torino',
    'Verbano-Cusio-Ossola',
    'Vercelli'
  ],
  Puglia: [
    'Bari',
    'Barletta-Andria-Trani',
    'Brindisi',
    'Foggia',
    'Lecce',
    'Taranto'
  ],
  Sardegna: [
    'Cagliari',
    'Carbonia-Iglesias',
    'Medio Campidano',
    'Nuoro',
    'Ogliastra',
    'Olbia-Tempio',
    'Oristano',
    'Sassari'
  ],
  Sicilia: [
    'Agrigento',
    'Caltanissetta',
    'Catania',
    'Enna',
    'Messina',
    'Palermo',
    'Ragusa',
    'Siracusa',
    'Trapani'
  ],
  Toscana: [
    'Arezzo',
    'Firenze',
    'Grosseto',
    'Livorno',
    'Lucca',
    'Massa-Carrara',
    'Pisa',
    'Pistoia',
    'Prato',
    'Siena'
  ],
  'Trentino-Alto Adige': ['Bolzano', 'Trento'],
  Umbria: ['Perugia', 'Terni'],
  "Valle d'Aosta": ['Aosta'],
  Veneto: [
    'Belluno',
    'Padova',
    'Rovigo',
    'Treviso',
    'Venezia',
    'Verona',
    'Vicenza'
  ]
};

const renSchema = new mongoose.Schema({
  numeroIscrizioneREN: {
    type: String,
    required: [true, 'Il numero di iscrizione REN è obbligatorio'],
    unique: true,
    trim: true
  },
  dataIscrizioneREN: {
    type: Date,
    required: [true, 'La data di iscrizione REN è obbligatoria']
  },
  dataScadenzaREN: {
    type: Date,
    required: [true, 'La data di scadenza REN è obbligatoria']
  },
  regione: {
    type: String,
    required: [true, 'La regione è obbligatoria'],
    enum: Object.keys(regioniProvince)
  },
  provincia: {
    type: String,
    required: [true, 'La provincia è obbligatoria'],
    validate: {
      validator: function (v) {
        return regioniProvince[this.regione].includes(v);
      },
      message: 'La provincia non corrisponde alla regione selezionata'
    }
  },
  tipologiaAttività: {
    type: String,
    required: [true, 'La tipologia di attività è obbligatoria'],
    enum: ['Conto Proprio', 'Conto Terzi']
  },
  numeroIscrizioneContoTerzi: {
    type: String,
    required: function () {
      return this.tipologiaAttività === 'Conto Terzi';
    },
    trim: true
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
renSchema.index({ dataScadenzaREN: 1 });
renSchema.index({ regione: 1, provincia: 1 });

// Middleware per aggiornare il campo updatedAt
renSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Metodo per verificare se l'iscrizione sta per scadere
renSchema.methods.inScadenza = function () {
  const oggi = new Date();
  const seiMesi = new Date(oggi.getTime() + 180 * 24 * 60 * 60 * 1000);
  const treMesi = new Date(oggi.getTime() + 90 * 24 * 60 * 60 * 1000);

  return {
    seiMesi: this.dataScadenzaREN < seiMesi,
    treMesi: this.dataScadenzaREN < treMesi
  };
};

// Virtual per ottenere le province per la regione
renSchema.virtual('provinceDisponibili').get(function () {
  return regioniProvince[this.regione] || [];
});

module.exports = mongoose.model('REN', renSchema);
