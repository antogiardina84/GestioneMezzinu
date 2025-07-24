const REN = require('../models/REN');
const fs = require('fs').promises;
const { normalizePathForUrl } = require('../middleware/fileUpload');

// @desc    Get all REN
// @route   GET /api/ren
// @access  Private
exports.getRENs = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    query = REN.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await REN.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const rens = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: rens.length,
      pagination,
      data: rens
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Get single REN
// @route   GET /api/ren/:id
// @access  Private
exports.getREN = async (req, res) => {
  try {
    const ren = await REN.findById(req.params.id);

    if (!ren) {
      return res.status(404).json({
        success: false,
        message: 'Iscrizione REN non trovata'
      });
    }

    res.status(200).json({
      success: true,
      data: ren
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Create new REN
// @route   POST /api/ren
// @access  Private/Admin
exports.createREN = async (req, res) => {
  try {
    const ren = await REN.create(req.body);

    res.status(201).json({
      success: true,
      data: ren
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update REN
// @route   PUT /api/ren/:id
// @access  Private/Admin
exports.updateREN = async (req, res) => {
  try {
    const ren = await REN.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!ren) {
      return res.status(404).json({
        success: false,
        message: 'Iscrizione REN non trovata'
      });
    }

    res.status(200).json({
      success: true,
      data: ren
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete REN
// @route   DELETE /api/ren/:id
// @access  Private/Admin
exports.deleteREN = async (req, res) => {
  try {
    const ren = await REN.findById(req.params.id);

    if (!ren) {
      return res.status(404).json({
        success: false,
        message: 'Iscrizione REN non trovata'
      });
    }

    // Delete all associated files
    for (const allegato of ren.allegati) {
      try {
        await fs.unlink(allegato.percorsoFile);
      } catch (err) {
        // Usa console.error che è consentito da ESLint config
        console.error(`Errore eliminazione file: ${err.message}`);
      }
    }

    await ren.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Upload allegati for REN
// @route   POST /api/ren/:id/allegati
// @access  Private/Admin
exports.uploadAllegati = async (req, res) => {
  try {
    const ren = await REN.findById(req.params.id);

    if (!ren) {
      return res.status(404).json({
        success: false,
        message: 'Iscrizione REN non trovata'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file caricato'
      });
    }

    // Process uploaded files
    const nuoviAllegati = req.files.map((file) => ({
      nomeFile: file.originalname,
      percorsoFile: normalizePathForUrl(file.path),
      tipo: req.body.tipo || 'Altro'
    }));

    // Add files to REN
    ren.allegati.push(...nuoviAllegati);
    await ren.save();

    res.status(200).json({
      success: true,
      data: ren.allegati
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Delete allegato
// @route   DELETE /api/ren/:id/allegati/:allegatoId
// @access  Private/Admin
exports.deleteAllegato = async (req, res) => {
  try {
    // Usa console.error che è consentito da ESLint config
    console.error('Ricevuta richiesta di eliminazione allegato:', {
      entityId: req.params.id,
      allegatoId: req.params.allegatoId
    });

    const ren = await REN.findById(req.params.id);

    if (!ren) {
      console.error('Iscrizione REN non trovata:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Iscrizione REN non trovata'
      });
    }

    // Verifica se l'allegato esiste
    const allegato = ren.allegati.id(req.params.allegatoId);

    if (!allegato) {
      console.error('Allegato non trovato:', req.params.allegatoId);
      return res.status(404).json({
        success: false,
        message: 'Allegato non trovato'
      });
    }

    // Stampa i dettagli dell'allegato che stiamo per eliminare
    console.error('Allegato trovato:', {
      _id: allegato._id,
      nomeFile: allegato.nomeFile,
      percorsoFile: allegato.percorsoFile
    });

    // Elimina il file dal filesystem
    try {
      await fs.unlink(allegato.percorsoFile);
      console.error(`File eliminato dal filesystem: ${allegato.percorsoFile}`);
    } catch (err) {
      console.error(`Errore eliminazione file: ${err.message}`);
      // Continuiamo comunque a eliminare il riferimento nel database
    }

    // IMPORTANTE: Non usare allegato.remove() - è deprecato
    // Usa il metodo pull per rimuovere l'elemento dall'array
    ren.allegati.pull(req.params.allegatoId);

    console.error(`Nuova lista allegati: ${ren.allegati.length} elementi`);

    // Salviamo le modifiche
    await ren.save();
    console.error('REN salvato con successo dopo rimozione allegato');

    res.status(200).json({
      success: true,
      message: 'Allegato eliminato con successo',
      data: {}
    });
  } catch (err) {
    console.error('Errore deleteAllegato:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server',
      details: err.message
    });
  }
};

// @desc    Get scadenze for REN
// @route   GET /api/ren/scadenze/all
// @access  Private
exports.getScadenze = async (req, res) => {
  try {
    const oggi = new Date();
    const seiMesi = new Date(oggi.getTime() + 180 * 24 * 60 * 60 * 1000);
    const treMesi = new Date(oggi.getTime() + 90 * 24 * 60 * 60 * 1000);

    const rens = await REN.find();

    const scadenze = {
      seiMesi: [],
      treMesi: [],
      scadute: []
    };

    rens.forEach((ren) => {
      const dataScadenza = ren.dataScadenzaREN;

      if (dataScadenza < oggi) {
        scadenze.scadute.push({
          ren: ren,
          dataScadenza,
          giorni: Math.floor((dataScadenza - oggi) / (1000 * 60 * 60 * 24))
        });
      } else if (dataScadenza < treMesi) {
        scadenze.treMesi.push({
          ren: ren,
          dataScadenza,
          giorni: Math.floor((dataScadenza - oggi) / (1000 * 60 * 60 * 24))
        });
      } else if (dataScadenza < seiMesi) {
        scadenze.seiMesi.push({
          ren: ren,
          dataScadenza,
          giorni: Math.floor((dataScadenza - oggi) / (1000 * 60 * 60 * 24))
        });
      }
    });

    // Sort by date
    Object.keys(scadenze).forEach((key) => {
      scadenze[key].sort((a, b) => a.dataScadenza - b.dataScadenza);
    });

    res.status(200).json({
      success: true,
      data: scadenze
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Get province for a region
// @route   GET /api/ren/province/:regione
// @access  Private
exports.getProvince = async (req, res) => {
  try {
    const regione = req.params.regione;

    // Mapping delle regioni e province italiane
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
      Marche: [
        'Ancona',
        'Ascoli Piceno',
        'Fermo',
        'Macerata',
        'Pesaro e Urbino'
      ],
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

    const province = regioniProvince[regione];

    if (!province) {
      return res.status(404).json({
        success: false,
        message: 'Regione non trovata'
      });
    }

    res.status(200).json({
      success: true,
      data: province
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};
