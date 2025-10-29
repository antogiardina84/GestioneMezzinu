// backend/controllers/autisti.js
const path = require('path');
const Autista = require('../models/Autista');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get tutti gli autisti
// @route   GET /api/autisti
// @access  Private
exports.getAutisti = asyncHandler(async (req, res, _next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  // Filtri
  let query = {};

  // Filtro per stato
  if (req.query.stato) {
    query.stato = req.query.stato;
  }

  // Filtro per attivo
  if (req.query.attivo !== undefined) {
    query.attivo = req.query.attivo === 'true';
  }

  // Filtro per nome/cognome (ricerca)
  if (req.query.search) {
    query.$or = [
      { nome: { $regex: req.query.search, $options: 'i' } },
      { cognome: { $regex: req.query.search, $options: 'i' } },
      { codiceFiscale: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Filtro per veicolo abilitato
  if (req.query.veicoloId) {
    query.$or = [
      { veicoliAbilitati: { $size: 0 } },
      { veicoliAbilitati: req.query.veicoloId }
    ];
  }

  // Filtro per disponibilità giorno
  if (req.query.giorno) {
    const giorni = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
    const giornoIndex = parseInt(req.query.giorno);
    if (giornoIndex >= 0 && giornoIndex <= 6) {
      query[`disponibilita.${giorni[giornoIndex]}`] = true;
    }
  }

  // Conta totale
  const total = await Autista.countDocuments(query);

  // Esegui query
  const autisti = await Autista.find(query)
    .populate('veicoliAbilitati', 'targa marca modello')
    .populate('user', 'nome cognome email')
    .sort({ cognome: 1, nome: 1 })
    .limit(limit)
    .skip(startIndex);

  // Pagination
  const pagination = {};
  const endIndex = page * limit;

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
    count: autisti.length,
    total,
    pagination,
    data: autisti
  });
});

// @desc    Get singolo autista
// @route   GET /api/autisti/:id
// @access  Private
exports.getAutista = asyncHandler(async (req, res, next) => {
  const autista = await Autista.findById(req.params.id)
    .populate('veicoliAbilitati', 'targa marca modello tipo')
    .populate('user', 'nome cognome email ruolo')
    .populate('createdBy', 'nome cognome')
    .populate('updatedBy', 'nome cognome');

  if (!autista) {
    return next(new ErrorResponse(`Autista non trovato con id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: autista
  });
});

// @desc    Crea nuovo autista
// @route   POST /api/autisti
// @access  Private
exports.createAutista = asyncHandler(async (req, res, _next) => {
  // Aggiungi user che ha creato
  req.body.createdBy = req.user.id;

  const autista = await Autista.create(req.body);

  res.status(201).json({
    success: true,
    data: autista
  });
});

// @desc    Aggiorna autista
// @route   PUT /api/autisti/:id
// @access  Private
exports.updateAutista = asyncHandler(async (req, res, next) => {
  let autista = await Autista.findById(req.params.id);

  if (!autista) {
    return next(new ErrorResponse(`Autista non trovato con id ${req.params.id}`, 404));
  }

  // Aggiungi user che ha modificato
  req.body.updatedBy = req.user.id;

  autista = await Autista.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: autista
  });
});

// @desc    Elimina autista
// @route   DELETE /api/autisti/:id
// @access  Private/Admin
exports.deleteAutista = asyncHandler(async (req, res, next) => {
  const autista = await Autista.findById(req.params.id);

  if (!autista) {
    return next(new ErrorResponse(`Autista non trovato con id ${req.params.id}`, 404));
  }

  // Soft delete: disattiva invece di eliminare
  autista.attivo = false;
  autista.stato = 'Cessato';
  await autista.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get autisti disponibili per un giorno/veicolo
// @route   GET /api/autisti/disponibili
// @access  Private
exports.getAutistiDisponibili = asyncHandler(async (req, res, next) => {
  const { giorno, veicoloId } = req.query;

  if (!giorno) {
    return next(new ErrorResponse('Specificare il giorno (0-6)', 400));
  }

  const giornoIndex = parseInt(giorno);
  const autisti = await Autista.trovaDisponibili(giornoIndex, veicoloId);

  res.status(200).json({
    success: true,
    count: autisti.length,
    data: autisti
  });
});

// @desc    Get lista autisti semplice (per dropdown)
// @route   GET /api/autisti/lista-semplice
// @access  Private
exports.getListaSemplice = asyncHandler(async (req, res, _next) => {
  const autisti = await Autista.find({ attivo: true, stato: 'Attivo' })
    .select('nome cognome contatti.telefono')
    .sort({ cognome: 1, nome: 1 });

  // Formatta per dropdown
  const lista = autisti.map(a => ({
    id: a._id,
    value: a._id,
    label: `${a.nome} ${a.cognome}`,
    nomeCompleto: `${a.nome} ${a.cognome}`,
    telefono: a.contatti?.telefono
  }));

  res.status(200).json({
    success: true,
    count: lista.length,
    data: lista
  });
});

// @desc    Verifica scadenze patenti
// @route   GET /api/autisti/scadenze/patenti
// @access  Private
exports.verificaScadenzePatenti = asyncHandler(async (req, res, _next) => {
  const giorniAvviso = parseInt(req.query.giorni, 10) || 30;
  
  const autisti = await Autista.find({ attivo: true });
  
  const scadenze = [];
  
  autisti.forEach(autista => {
    const patentiInScadenza = autista.verificaPatenteInScadenza(giorniAvviso);
    if (patentiInScadenza.length > 0) {
      scadenze.push({
        autista: {
          id: autista._id,
          nomeCompleto: autista.nomeCompleto,
          telefono: autista.contatti?.telefono
        },
        patenti: patentiInScadenza
      });
    }
  });

  res.status(200).json({
    success: true,
    count: scadenze.length,
    giorniAvviso,
    data: scadenze
  });
});

// @desc    Verifica scadenze qualifiche
// @route   GET /api/autisti/scadenze/qualifiche
// @access  Private
exports.verificaScadenzeQualifiche = asyncHandler(async (req, res, _next) => {
  const giorniAvviso = parseInt(req.query.giorni, 10) || 30;
  
  const autisti = await Autista.find({ attivo: true });
  
  const scadenze = [];
  
  autisti.forEach(autista => {
    const qualificheInScadenza = autista.verificaQualificheInScadenza(giorniAvviso);
    if (qualificheInScadenza.length > 0) {
      scadenze.push({
        autista: {
          id: autista._id,
          nomeCompleto: autista.nomeCompleto,
          telefono: autista.contatti?.telefono
        },
        qualifiche: qualificheInScadenza
      });
    }
  });

  res.status(200).json({
    success: true,
    count: scadenze.length,
    giorniAvviso,
    data: scadenze
  });
});

// @desc    Upload allegato autista
// @route   POST /api/autisti/:id/allegati
// @access  Private
exports.uploadAllegato = asyncHandler(async (req, res, next) => {
  const autista = await Autista.findById(req.params.id);

  if (!autista) {
    return next(new ErrorResponse(`Autista non trovato con id ${req.params.id}`, 404));
  }

  if (!req.files || !req.files.file) {
    return next(new ErrorResponse('Nessun file caricato', 400));
  }

  const file = req.files.file;
  
  // Validazione file
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(new ErrorResponse(`File troppo grande. Max ${process.env.MAX_FILE_UPLOAD}`, 400));
  }

  // Crea nome file unico
  file.name = `autista_${autista._id}_${Date.now()}${path.parse(file.name).ext}`;

  // Upload
  file.mv(`${process.env.FILE_UPLOAD_PATH}/autisti/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Errore durante upload file', 500));
    }

    // Aggiungi allegato
    autista.allegati.push({
      tipo: req.body.tipo || 'Altro',
      nomeFile: file.name,
      percorsoFile: `/uploads/autisti/${file.name}`,
      dataScadenza: req.body.dataScadenza
    });

    await autista.save();

    res.status(200).json({
      success: true,
      data: autista
    });
  });
});

// @desc    Elimina allegato autista
// @route   DELETE /api/autisti/:id/allegati/:allegatoId
// @access  Private
exports.deleteAllegato = asyncHandler(async (req, res, next) => {
  const autista = await Autista.findById(req.params.id);

  if (!autista) {
    return next(new ErrorResponse(`Autista non trovato con id ${req.params.id}`, 404));
  }

  const allegato = autista.allegati.id(req.params.allegatoId);

  if (!allegato) {
    return next(new ErrorResponse('Allegato non trovato', 404));
  }

  // Rimuovi file fisico
  const fs = require('fs');
  const filePath = `${process.env.FILE_UPLOAD_PATH}/autisti/${allegato.nomeFile}`;
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Rimuovi da DB
  allegato.remove();
  await autista.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get statistiche autisti
// @route   GET /api/autisti/stats
// @access  Private
exports.getStatistiche = asyncHandler(async (req, res, _next) => {
  const totale = await Autista.countDocuments();
  const attivi = await Autista.countDocuments({ attivo: true, stato: 'Attivo' });
  const inFerie = await Autista.countDocuments({ stato: 'In Ferie' });
  const malattia = await Autista.countDocuments({ stato: 'Malattia' });
  const sospesi = await Autista.countDocuments({ stato: 'Sospeso' });

  // Scadenze imminenti (30 giorni)
  const autistiConScadenze = await Autista.find({ attivo: true });
  let patenteInScadenza = 0;
  let qualificheInScadenza = 0;

  autistiConScadenze.forEach(autista => {
    if (autista.verificaPatenteInScadenza(30).length > 0) patenteInScadenza++;
    if (autista.verificaQualificheInScadenza(30).length > 0) qualificheInScadenza++;
  });

  res.status(200).json({
    success: true,
    data: {
      totale,
      attivi,
      inFerie,
      malattia,
      sospesi,
      scadenze: {
        patenti: patenteInScadenza,
        qualifiche: qualificheInScadenza
      }
    }
  });
});