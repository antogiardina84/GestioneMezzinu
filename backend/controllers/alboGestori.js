/* eslint-disable no-console */
// backend/controllers/alboGestori.js
const AlboGestori = require('../models/AlboGestori');
const fs = require('fs').promises;
const { normalizePathForUrl } = require('../middleware/fileUpload');

// @desc    Get all albo gestori
// @route   GET /api/albo-gestori
// @access  Private
exports.getAlboGestori = async (req, res) => {
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
    query = AlboGestori.find(JSON.parse(queryStr));

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
    const total = await AlboGestori.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const alboGestori = await query;

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
      count: alboGestori.length,
      pagination,
      data: alboGestori
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Get single albo gestore
// @route   GET /api/albo-gestori/:id
// @access  Private
exports.getAlboGestore = async (req, res) => {
  try {
    const alboGestore = await AlboGestori.findById(req.params.id);

    if (!alboGestore) {
      return res.status(404).json({
        success: false,
        message: 'Iscrizione Albo Gestori non trovata'
      });
    }

    res.status(200).json({
      success: true,
      data: alboGestore
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Create new albo gestore
// @route   POST /api/albo-gestori
// @access  Private/Admin
exports.createAlboGestore = async (req, res) => {
  try {
    const alboGestore = await AlboGestori.create(req.body);

    res.status(201).json({
      success: true,
      data: alboGestore
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update albo gestore
// @route   PUT /api/albo-gestori/:id
// @access  Private/Admin
exports.updateAlboGestore = async (req, res) => {
  try {
    const alboGestore = await AlboGestori.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!alboGestore) {
      return res.status(404).json({
        success: false,
        message: 'Iscrizione Albo Gestori non trovata'
      });
    }

    res.status(200).json({
      success: true,
      data: alboGestore
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete albo gestore
// @route   DELETE /api/albo-gestori/:id
// @access  Private/Admin
exports.deleteAlboGestore = async (req, res) => {
  try {
    const alboGestore = await AlboGestori.findById(req.params.id);

    if (!alboGestore) {
      return res.status(404).json({
        success: false,
        message: 'Iscrizione Albo Gestori non trovata'
      });
    }

    // Delete all associated files
    for (const allegato of alboGestore.allegati) {
      try {
        await fs.unlink(allegato.percorsoFile);
      } catch (err) {
        console.error(`Errore eliminazione file: ${err.message}`);
      }
    }

    await alboGestore.deleteOne();

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

// @desc    Upload allegati for albo gestore
// @route   POST /api/albo-gestori/:id/allegati
// @access  Private/Admin
exports.uploadAllegati = async (req, res) => {
  try {
    const alboGestore = await AlboGestori.findById(req.params.id);

    if (!alboGestore) {
      return res.status(404).json({
        success: false,
        message: 'Iscrizione Albo Gestori non trovata'
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

    // Add files to albo gestore
    alboGestore.allegati.push(...nuoviAllegati);
    await alboGestore.save();

    res.status(200).json({
      success: true,
      data: alboGestore.allegati
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Delete allegato
// @route   DELETE /api/albo-gestori/:id/allegati/:allegatoId
// @access  Private/Admin
exports.deleteAllegato = async (req, res) => {
  try {
    console.log('Ricevuta richiesta di eliminazione allegato:', {
      entityId: req.params.id,
      allegatoId: req.params.allegatoId
    });

    const alboGestore = await AlboGestori.findById(req.params.id);

    if (!alboGestore) {
      console.log('Iscrizione Albo Gestori non trovata:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Iscrizione Albo Gestori non trovata'
      });
    }

    // Verifica se l'allegato esiste
    const allegato = alboGestore.allegati.id(req.params.allegatoId);

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
      console.log(`File eliminato dal filesystem: ${allegato.percorsoFile}`);
    } catch (err) {
      console.error(`Errore eliminazione file: ${err.message}`);
      // Continuiamo comunque a eliminare il riferimento nel database
    }

    // IMPORTANTE: Non usare allegato.remove() - è deprecato
    // Usa il metodo pull per rimuovere l'elemento dall'array
    alboGestore.allegati.pull(req.params.allegatoId);

    console.log(
      `Nuova lista allegati: ${alboGestore.allegati.length} elementi`
    );

    // Salviamo le modifiche
    await alboGestore.save();
    console.log('Albo Gestori salvato con successo dopo rimozione allegato');

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

// @desc    Get scadenze for albo gestori
// @route   GET /api/albo-gestori/scadenze/all
// @access  Private
exports.getScadenze = async (req, res) => {
  try {
    const oggi = new Date();
    const seiMesi = new Date(oggi.getTime() + 180 * 24 * 60 * 60 * 1000);
    const treMesi = new Date(oggi.getTime() + 90 * 24 * 60 * 60 * 1000);

    const alboGestori = await AlboGestori.find();

    const scadenze = {
      seiMesi: [],
      treMesi: [],
      scadute: []
    };

    alboGestori.forEach((albo) => {
      const dataScadenza = albo.dataScadenzaIscrizione;

      if (dataScadenza < oggi) {
        scadenze.scadute.push({
          alboGestore: albo,
          dataScadenza,
          giorni: Math.floor((dataScadenza - oggi) / (1000 * 60 * 60 * 24))
        });
      } else if (dataScadenza < treMesi) {
        scadenze.treMesi.push({
          alboGestore: albo,
          dataScadenza,
          giorni: Math.floor((dataScadenza - oggi) / (1000 * 60 * 60 * 24))
        });
      } else if (dataScadenza < seiMesi) {
        scadenze.seiMesi.push({
          alboGestore: albo,
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
