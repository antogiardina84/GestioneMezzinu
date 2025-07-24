const Autoveicolo = require('../models/Autoveicolo');
const path = require('path');
const fs = require('fs').promises;

const { normalizePathForUrl } = require('../middleware/fileUpload');

// @desc    Get all autoveicoli
// @route   GET /api/autoveicoli
// @access  Private
exports.getAutoveicoli = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Parse the query
    let filterQuery = JSON.parse(queryStr);

    // Add search functionality
    if (req.query.search) {
      filterQuery.$or = [
        { targa: new RegExp(req.query.search, 'i') },
        { marca: new RegExp(req.query.search, 'i') },
        { modello: new RegExp(req.query.search, 'i') }
      ];
    }

    // Finding resource
    query = Autoveicolo.find(filterQuery);

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
    const total = await Autoveicolo.countDocuments(filterQuery);

    query = query.skip(startIndex).limit(limit);

    // Populate references
    query = query.populate('iscrizioneANGA');

    // Executing query
    const autoveicoli = await query;

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
      count: total,
      pagination,
      data: autoveicoli
    });
  } catch (err) {
    console.error('Errore get autoveicoli:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Get single autoveicolo
// @route   GET /api/autoveicoli/:id
// @access  Private
exports.getAutoveicolo = async (req, res, next) => {
  try {
    const autoveicolo = await Autoveicolo.findById(req.params.id).populate(
      'iscrizioneANGA'
    );

    if (!autoveicolo) {
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: autoveicolo
    });
  } catch (err) {
    console.error('Errore get autoveicolo:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Create new autoveicolo
// @route   POST /api/autoveicoli
// @access  Private/Admin
exports.createAutoveicolo = async (req, res, next) => {
  try {
    console.log('=== DEBUG BACKEND CREATE ===');
    console.log('Dati ricevuti:', req.body);
    console.log('Tipo carrozzeria:', req.body.tipoCarrozzeria);
    console.log('Cilindrata:', req.body.cilindrata);
    console.log('KW:', req.body.kw);

    const autoveicolo = await Autoveicolo.create(req.body);

    res.status(201).json({
      success: true,
      data: autoveicolo
    });
  } catch (err) {
    console.error('=== ERRORE BACKEND CREATE ===');
    console.error('Errore completo:', err);
    console.error('Validation errors:', err.errors);
    console.error('Error message:', err.message);

    res.status(400).json({
      success: false,
      error: err.message,
      details: err.errors // Aggiungi dettagli errori di validazione
    });
  }
};

// @desc    Update autoveicolo
// @route   PUT /api/autoveicoli/:id
// @access  Private/Admin
exports.updateAutoveicolo = async (req, res, next) => {
  try {
    const autoveicolo = await Autoveicolo.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!autoveicolo) {
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: autoveicolo
    });
  } catch (err) {
    console.error('Errore update autoveicolo:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete autoveicolo
// @route   DELETE /api/autoveicoli/:id
// @access  Private/Admin
exports.deleteAutoveicolo = async (req, res, next) => {
  try {
    const autoveicolo = await Autoveicolo.findById(req.params.id);

    if (!autoveicolo) {
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
      });
    }

    // Delete all associated files
    for (const allegato of autoveicolo.allegati) {
      try {
        await fs.unlink(allegato.percorsoFile);
      } catch (err) {
        console.error(`Errore eliminazione file: ${err.message}`);
      }
    }

    await autoveicolo.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Errore delete autoveicolo:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Upload allegati for autoveicolo
// @route   POST /api/autoveicoli/:id/allegati
// @access  Private/Admin
exports.uploadAllegati = async (req, res, next) => {
  try {
    const autoveicolo = await Autoveicolo.findById(req.params.id);

    if (!autoveicolo) {
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
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

    // Add files to autoveicolo
    autoveicolo.allegati.push(...nuoviAllegati);
    await autoveicolo.save();

    res.status(200).json({
      success: true,
      data: autoveicolo.allegati
    });
  } catch (err) {
    console.error('Errore upload allegati:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Delete allegato
// @route   DELETE /api/autoveicoli/:id/allegati/:allegatoId
// @access  Private/Admin
exports.deleteAllegato = async (req, res, next) => {
  try {
    console.log('Ricevuta richiesta di eliminazione allegato:', {
      entityId: req.params.id,
      allegatoId: req.params.allegatoId
    });

    const autoveicolo = await Autoveicolo.findById(req.params.id);

    if (!autoveicolo) {
      console.log('Autoveicolo non trovato:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
      });
    }

    // Verifica se l'allegato esiste
    const allegato = autoveicolo.allegati.id(req.params.allegatoId);

    if (!allegato) {
      console.log('Allegato non trovato:', req.params.allegatoId);
      return res.status(404).json({
        success: false,
        message: 'Allegato non trovato'
      });
    }

    // Stampa i dettagli dell'allegato che stiamo per eliminare
    console.log('Allegato trovato:', {
      _id: allegato._id,
      nomeFile: allegato.nomeFile,
      percorsoFile: allegato.percorsoFile
    });

    // Elimina il file dal filesystem
    try {
      await fs.unlink(allegato.percorsoFile);
      console.log('File eliminato dal filesystem:', allegato.percorsoFile);
    } catch (err) {
      console.error('Errore eliminazione file:', err.message);
      // Continuiamo comunque a eliminare il riferimento nel database
    }

    // IMPORTANTE: Non usare allegato.remove() - è deprecato
    // Usa il metodo pull per rimuovere l'elemento dall'array
    autoveicolo.allegati.pull(req.params.allegatoId);

    console.log(
      'Nuova lista allegati:',
      autoveicolo.allegati.length,
      'elementi'
    );

    // Salviamo le modifiche
    await autoveicolo.save();
    console.log('Autoveicolo salvato con successo dopo rimozione allegato');

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

// Funzione helper per calcolare la prossima revisione basata sul tipo di carrozzeria
const calcolaProssimaRevisione = (autoveicolo) => {
  const intervalli = autoveicolo.getIntervallorevisione();

  if (autoveicolo.ultimaRevisione) {
    // Se ha fatto almeno una revisione, calcola la prossima in base al tipo
    const ultimaRevisionData = new Date(autoveicolo.ultimaRevisione);
    const prossima = new Date(ultimaRevisionData);
    prossima.setFullYear(
      ultimaRevisionData.getFullYear() + intervalli.revisioniSuccessive
    );
    return prossima;
  } else {
    // Se non ha mai fatto revisione, la prima è calcolata dall'immatricolazione
    const immatricolazioneData = new Date(autoveicolo.dataImmatricolazione);
    const prossima = new Date(immatricolazioneData);
    prossima.setFullYear(
      immatricolazioneData.getFullYear() + intervalli.primaRevisione
    );
    return prossima;
  }
};

// @desc    Get scadenze for autoveicoli
// @route   GET /api/autoveicoli/scadenze/all
// @access  Private
exports.getScadenze = async (req, res, next) => {
  try {
    const oggi = new Date();

    const autoveicoli = await Autoveicolo.find({ stato: 'Attivo' }).populate(
      'iscrizioneANGA'
    );

    const scadenze = {
      revisioni: [],
      bolli: [],
      assicurazioni: [],
      titoloProprieta: []
    };

    autoveicoli.forEach((auto) => {
      // Revisioni - Usa la nuova logica basata sul tipo di carrozzeria
      const prossimaRevisione = calcolaProssimaRevisione(auto);

      // Determina il periodo di controllo in base al tipo di veicolo
      const intervalli = auto.getIntervallorevisione();
      let periodoControllo;

      if (intervalli.revisioniSuccessive === 1) {
        // Per veicoli con revisione annuale, controlla fino a 2 mesi prima
        periodoControllo = new Date(oggi.getTime() + 60 * 24 * 60 * 60 * 1000);
      } else {
        // Per veicoli con revisione biennale/quadriennale, controlla fino a 1 anno prima
        periodoControllo = new Date(oggi.getTime() + 365 * 24 * 60 * 60 * 1000);
      }

      if (prossimaRevisione <= periodoControllo) {
        const giorni = Math.floor(
          (prossimaRevisione - oggi) / (1000 * 60 * 60 * 24)
        );
        scadenze.revisioni.push({
          autoveicolo: auto,
          data: prossimaRevisione,
          urgent: giorni <= 0,
          giorni: giorni,
          tipoRevisione:
            intervalli.revisioniSuccessive === 1
              ? 'Annuale'
              : 'Biennale/Quadriennale'
        });
      }

      // Bolli
      const unMese = new Date(oggi.getTime() + 30 * 24 * 60 * 60 * 1000);
      const giorniBollu = Math.floor(
        (auto.dataScadenzaBollo - oggi) / (1000 * 60 * 60 * 24)
      );
      if (giorniBollu <= 30) {
        scadenze.bolli.push({
          autoveicolo: auto,
          data: auto.dataScadenzaBollo,
          urgent: giorniBollu <= 0,
          giorni: giorniBollu
        });
      }

      // Assicurazioni
      const giorniAssicurazione = Math.floor(
        (auto.dataScadenzaAssicurazione - oggi) / (1000 * 60 * 60 * 24)
      );
      if (giorniAssicurazione <= 30) {
        scadenze.assicurazioni.push({
          autoveicolo: auto,
          data: auto.dataScadenzaAssicurazione,
          urgent: giorniAssicurazione <= 0,
          giorni: giorniAssicurazione
        });
      }

      // Titolo Proprietà
      if (auto.scadenzaTitoloProprietà) {
        const seiMesi = new Date(oggi.getTime() + 180 * 24 * 60 * 60 * 1000);
        const giorniTitolo = Math.floor(
          (auto.scadenzaTitoloProprietà - oggi) / (1000 * 60 * 60 * 24)
        );
        if (giorniTitolo <= 180) {
          scadenze.titoloProprieta.push({
            autoveicolo: auto,
            data: auto.scadenzaTitoloProprietà,
            urgent: giorniTitolo <= 90,
            giorni: giorniTitolo
          });
        }
      }
    });

    // Sort by date
    Object.keys(scadenze).forEach((key) => {
      scadenze[key].sort((a, b) => a.data - b.data);
    });

    res.status(200).json({
      success: true,
      data: scadenze
    });
  } catch (err) {
    console.error('Errore get scadenze:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Update stato autoveicolo
// @route   PUT /api/autoveicoli/:id/stato
// @access  Private/Admin
exports.updateStato = async (req, res, next) => {
  try {
    const { stato } = req.body;

    if (!['Attivo', 'Chiuso', 'Venduto', 'Demolito'].includes(stato)) {
      return res.status(400).json({
        success: false,
        message: 'Stato non valido'
      });
    }

    const autoveicolo = await Autoveicolo.findByIdAndUpdate(
      req.params.id,
      { stato },
      {
        new: true,
        runValidators: true
      }
    );

    if (!autoveicolo) {
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: autoveicolo
    });
  } catch (err) {
    console.error('Errore update stato:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Demolisci autoveicolo
// @route   PUT /api/autoveicoli/:id/demolisci
// @access  Private/Admin
exports.demolisciAutoveicolo = async (req, res, next) => {
  try {
    const { datiDemolitore, dataDemolizione } = req.body;

    const autoveicolo = await Autoveicolo.findByIdAndUpdate(
      req.params.id,
      {
        stato: 'Demolito',
        datiDemolizione: {
          datiDemolitore,
          dataDemolizione: dataDemolizione || new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!autoveicolo) {
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: autoveicolo
    });
  } catch (err) {
    console.error('Errore demolizione:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Vendi autoveicolo
// @route   PUT /api/autoveicoli/:id/vendi
// @access  Private/Admin
exports.vendiAutoveicolo = async (req, res, next) => {
  try {
    const autoveicolo = await Autoveicolo.findByIdAndUpdate(
      req.params.id,
      { stato: 'Venduto' },
      {
        new: true,
        runValidators: true
      }
    );

    if (!autoveicolo) {
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: autoveicolo
    });
  } catch (err) {
    console.error('Errore vendita:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};
