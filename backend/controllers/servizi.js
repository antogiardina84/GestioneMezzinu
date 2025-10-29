// backend/controllers/servizi.js
const Servizio = require('../models/Servizio');
const Autoveicolo = require('../models/Autoveicolo');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const path = require('path');
const fs = require('fs');

// @desc    Get all servizi con filtri avanzati
// @route   GET /api/servizi
// @access  Private
exports.getServizi = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  if (req.query.autoveicolo) {
    filter.autoveicolo = req.query.autoveicolo;
  }
  
  if (req.query.autista) {
    filter.autista = { $regex: req.query.autista, $options: 'i' };
  }
  
  if (req.query.stato) {
    filter.stato = req.query.stato;
  }
  
  if (req.query.tipoServizio) {
    filter.tipoServizio = req.query.tipoServizio;
  }
  
  if (req.query.priorita) {
    filter.priorita = req.query.priorita;
  }

  // Filtro per data
  if (req.query.dataInizio && req.query.dataFine) {
    filter.dataInizio = {
      $gte: new Date(req.query.dataInizio),
      $lte: new Date(req.query.dataFine)
    };
  } else if (req.query.dataInizio) {
    filter.dataInizio = { $gte: new Date(req.query.dataInizio) };
  } else if (req.query.dataFine) {
    filter.dataInizio = { $lte: new Date(req.query.dataFine) };
  }

  // Filtro per mese e anno (per vista calendario)
  if (req.query.mese && req.query.anno) {
    const mese = parseInt(req.query.mese);
    const anno = parseInt(req.query.anno);
    const inizioMese = new Date(anno, mese - 1, 1);
    const fineMese = new Date(anno, mese, 0, 23, 59, 59);
    
    filter.dataInizio = {
      $gte: inizioMese,
      $lte: fineMese
    };
  }

  // Filtro completato
  if (req.query.completato !== undefined) {
    filter.completato = req.query.completato === 'true';
  }

  // Search functionality
  if (req.query.search) {
    filter.$or = [
      { titolo: { $regex: req.query.search, $options: 'i' } },
      { descrizione: { $regex: req.query.search, $options: 'i' } },
      { autista: { $regex: req.query.search, $options: 'i' } },
      { note: { $regex: req.query.search, $options: 'i' } },
      { 'cliente.nome': { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const total = await Servizio.countDocuments(filter);
  
  const servizi = await Servizio.find(filter)
    .populate({
      path: 'autoveicolo',
      select: 'targa marca modello tipoCarrozzeria autista portataMax'
    })
    .populate({
      path: 'autista',
      select: 'nome cognome contatti.telefono contatti.email'
    })
    .populate('createdBy', 'nome email')
    .populate('updatedBy', 'nome email')
    .sort({ dataInizio: 1, oraInizio: 1 })
    .skip(skip)
    .limit(limit);

  // Pagination
  const pagination = {};
  
  if (skip + limit < total) {
    pagination.next = { page: page + 1, limit };
  }
  
  if (skip > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  res.status(200).json({
    success: true,
    count: servizi.length,
    total,
    pagination,
    data: servizi
  });
});

// @desc    Get single servizio
// @route   GET /api/servizi/:id
// @access  Private
exports.getServizio = asyncHandler(async (req, res, next) => {
  const servizio = await Servizio.findById(req.params.id)
    .populate({
      path: 'autoveicolo',
      select: 'targa marca modello tipoCarrozzeria autista portataMax dataImmatricolazione'
    })
    .populate({
      path: 'autista',
      select: 'nome cognome contatti.telefono contatti.email patenti qualifiche'
    })
    .populate('createdBy', 'nome email')
    .populate('updatedBy', 'nome email');

  if (!servizio) {
    return next(new ErrorResponse('Servizio non trovato', 404));
  }

  res.status(200).json({
    success: true,
    data: servizio
  });
});

// @desc    Create servizio
// @route   POST /api/servizi
// @access  Private
exports.createServizio = asyncHandler(async (req, res, next) => {
  // Verifica che l'autoveicolo esista
  const autoveicolo = await Autoveicolo.findById(req.body.autoveicolo);
  if (!autoveicolo) {
    return next(new ErrorResponse('Autoveicolo non trovato', 404));
  }

  // Se l'autista non è specificato, usa quello dell'autoveicolo
  if (!req.body.autista && autoveicolo.autista) {
    req.body.autista = autoveicolo.autista;
  }

  // Aggiungi l'utente che crea (se disponibile)
  if (req.user) {
    req.body.createdBy = req.user.id;
  }

  const servizio = await Servizio.create(req.body);
  
  // Verifica conflitti
  const conflitti = await servizio.verificaConflitti();
  
  await servizio.populate([
    {
      path: 'autoveicolo',
      select: 'targa marca modello tipoCarrozzeria'
    },
    {
      path: 'autista',
      select: 'nome cognome contatti.telefono'
    }
  ]);

  res.status(201).json({
    success: true,
    data: servizio,
    conflitti: conflitti.length > 0 ? conflitti : null
  });
});

// @desc    Update servizio
// @route   PUT /api/servizi/:id
// @access  Private
exports.updateServizio = asyncHandler(async (req, res, next) => {
  let servizio = await Servizio.findById(req.params.id);

  if (!servizio) {
    return next(new ErrorResponse('Servizio non trovato', 404));
  }

  // Aggiungi l'utente che modifica (se disponibile)
  if (req.user) {
    req.body.updatedBy = req.user.id;
  }

  servizio = await Servizio.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate({
    path: 'autoveicolo',
    select: 'targa marca modello tipoCarrozzeria'
  }).populate({
    path: 'autista',
    select: 'nome cognome contatti.telefono'
  });

  res.status(200).json({
    success: true,
    data: servizio
  });
});

// @desc    Delete servizio
// @route   DELETE /api/servizi/:id
// @access  Private
exports.deleteServizio = asyncHandler(async (req, res, next) => {
  const servizio = await Servizio.findById(req.params.id);

  if (!servizio) {
    return next(new ErrorResponse('Servizio non trovato', 404));
  }

  // Elimina i file allegati
  if (servizio.allegati && servizio.allegati.length > 0) {
    for (const allegato of servizio.allegati) {
      const filePath = path.join(__dirname, '..', allegato.percorsoFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  await servizio.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload allegati per servizio
// @route   POST /api/servizi/:id/allegati
// @access  Private
exports.uploadAllegati = asyncHandler(async (req, res, next) => {
  const servizio = await Servizio.findById(req.params.id);

  if (!servizio) {
    return next(new ErrorResponse('Servizio non trovato', 404));
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorResponse('Nessun file caricato', 400));
  }

  const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
  const allegati = [];

  // Directory per gli allegati del servizio
  const uploadDir = path.join(__dirname, '..', 'uploads', 'servizi', servizio._id.toString());
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  for (const file of files) {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    await file.mv(filePath);

    allegati.push({
      nomeFile: file.name,
      percorsoFile: `uploads/servizi/${servizio._id}/${fileName}`,
      tipo: req.body.tipo || 'Altro'
    });
  }

  servizio.allegati.push(...allegati);
  await servizio.save();

  res.status(200).json({
    success: true,
    data: servizio
  });
});

// @desc    Delete allegato
// @route   DELETE /api/servizi/:id/allegati/:allegatoId
// @access  Private
exports.deleteAllegato = asyncHandler(async (req, res, next) => {
  const servizio = await Servizio.findById(req.params.id);

  if (!servizio) {
    return next(new ErrorResponse('Servizio non trovato', 404));
  }

  const allegatoIndex = servizio.allegati.findIndex(
    a => a._id.toString() === req.params.allegatoId
  );

  if (allegatoIndex === -1) {
    return next(new ErrorResponse('Allegato non trovato', 404));
  }

  const allegato = servizio.allegati[allegatoIndex];
  const filePath = path.join(__dirname, '..', allegato.percorsoFile);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  servizio.allegati.splice(allegatoIndex, 1);
  await servizio.save();

  res.status(200).json({
    success: true,
    data: servizio
  });
});

// @desc    Get servizi calendario (vista mensile/settimanale/giornaliera)
// @route   GET /api/servizi/calendario/:tipo
// @access  Private
exports.getServiziCalendario = asyncHandler(async (req, res, next) => {
  const { tipo } = req.params; // 'mese', 'settimana', 'giorno'
  const { data } = req.query; // Data di riferimento

  let dataRiferimento = data ? new Date(data) : new Date();
  let dataInizio, dataFine;

  switch (tipo) {
  case 'mese': {
    dataInizio = new Date(dataRiferimento.getFullYear(), dataRiferimento.getMonth(), 1);
    dataFine = new Date(dataRiferimento.getFullYear(), dataRiferimento.getMonth() + 1, 0, 23, 59, 59);
    break;
  }
    
  case 'settimana': {
    const giornoSettimana = dataRiferimento.getDay();
    dataInizio = new Date(dataRiferimento);
    dataInizio.setDate(dataRiferimento.getDate() - giornoSettimana);
    dataInizio.setHours(0, 0, 0, 0);
      
    dataFine = new Date(dataInizio);
    dataFine.setDate(dataInizio.getDate() + 6);
    dataFine.setHours(23, 59, 59, 999);
    break;
  }
    
  case 'giorno': {
    dataInizio = new Date(dataRiferimento);
    dataInizio.setHours(0, 0, 0, 0);
      
    dataFine = new Date(dataRiferimento);
    dataFine.setHours(23, 59, 59, 999);
    break;
  }
    
  default:
    return next(new ErrorResponse('Tipo di vista non valido', 400));
  }

  const servizi = await Servizio.find({
    $or: [
      {
        dataInizio: { $gte: dataInizio, $lte: dataFine }
      },
      {
        dataFine: { $gte: dataInizio, $lte: dataFine }
      },
      {
        dataInizio: { $lte: dataInizio },
        dataFine: { $gte: dataFine }
      }
    ]
  })
    .populate({
      path: 'autoveicolo',
      select: 'targa marca modello tipoCarrozzeria autista'
    })
    .populate({
      path: 'autista',
      select: 'nome cognome contatti.telefono'
    })
    .sort({ dataInizio: 1, oraInizio: 1 });

  // Raggruppa per giorno
  const serviziRaggruppati = servizi.reduce((acc, servizio) => {
    const dataKey = servizio.dataInizio.toISOString().split('T')[0];
    if (!acc[dataKey]) {
      acc[dataKey] = [];
    }
    acc[dataKey].push(servizio);
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    periodo: {
      tipo,
      dataInizio,
      dataFine
    },
    count: servizi.length,
    data: serviziRaggruppati
  });
});

// @desc    Get statistiche servizi
// @route   GET /api/servizi/statistiche
// @access  Private
exports.getStatistiche = asyncHandler(async (req, res) => {
  const { anno } = req.query;
  const annoCorrente = anno ? parseInt(anno) : new Date().getFullYear();

  const inizioAnno = new Date(annoCorrente, 0, 1);
  const fineAnno = new Date(annoCorrente, 11, 31, 23, 59, 59);

  // Statistiche per tipo di servizio
  const statistichePerTipo = await Servizio.aggregate([
    {
      $match: {
        dataInizio: { $gte: inizioAnno, $lte: fineAnno }
      }
    },
    {
      $group: {
        _id: '$tipoServizio',
        count: { $sum: 1 },
        completati: {
          $sum: { $cond: [{ $eq: ['$completato', true] }, 1, 0] }
        },
        chilometraggioTotale: { $sum: '$chilometraggio.totale' },
        costiTotali: {
          $sum: {
            $add: ['$costi.pedaggi', '$costi.parcheggi', '$costi.altri']
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Statistiche per autoveicolo
  const statistichePerAutoveicolo = await Servizio.aggregate([
    {
      $match: {
        dataInizio: { $gte: inizioAnno, $lte: fineAnno }
      }
    },
    {
      $group: {
        _id: '$autoveicolo',
        count: { $sum: 1 },
        completati: {
          $sum: { $cond: [{ $eq: ['$completato', true] }, 1, 0] }
        },
        chilometraggioTotale: { $sum: '$chilometraggio.totale' }
      }
    },
    {
      $lookup: {
        from: 'autoveicoli',
        localField: '_id',
        foreignField: '_id',
        as: 'autoveicolo'
      }
    },
    {
      $unwind: '$autoveicolo'
    },
    {
      $project: {
        _id: 1,
        count: 1,
        completati: 1,
        chilometraggioTotale: 1,
        'autoveicolo.targa': 1,
        'autoveicolo.marca': 1,
        'autoveicolo.modello': 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Statistiche per autista
  const statistichePerAutista = await Servizio.aggregate([
    {
      $match: {
        dataInizio: { $gte: inizioAnno, $lte: fineAnno }
      }
    },
    {
      $group: {
        _id: '$autista',
        count: { $sum: 1 },
        completati: {
          $sum: { $cond: [{ $eq: ['$completato', true] }, 1, 0] }
        },
        chilometraggioTotale: { $sum: '$chilometraggio.totale' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Servizi per mese
  const serviziMensili = await Servizio.aggregate([
    {
      $match: {
        dataInizio: { $gte: inizioAnno, $lte: fineAnno }
      }
    },
    {
      $group: {
        _id: { $month: '$dataInizio' },
        count: { $sum: 1 },
        completati: {
          $sum: { $cond: [{ $eq: ['$completato', true] }, 1, 0] }
        },
        chilometraggioTotale: { $sum: '$chilometraggio.totale' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Contatori generali
  const totaleServizi = await Servizio.countDocuments({
    dataInizio: { $gte: inizioAnno, $lte: fineAnno }
  });

  const serviziCompletati = await Servizio.countDocuments({
    dataInizio: { $gte: inizioAnno, $lte: fineAnno },
    completato: true
  });

  const serviziInCorso = await Servizio.countDocuments({
    stato: 'In corso'
  });

  const serviziProgrammati = await Servizio.countDocuments({
    stato: 'Programmato',
    dataInizio: { $gte: new Date() }
  });

  res.status(200).json({
    success: true,
    data: {
      anno: annoCorrente,
      contatori: {
        totale: totaleServizi,
        completati: serviziCompletati,
        inCorso: serviziInCorso,
        programmati: serviziProgrammati,
        tassoCompletamento: totaleServizi > 0 ? ((serviziCompletati / totaleServizi) * 100).toFixed(2) : 0
      },
      statistichePerTipo,
      statistichePerAutoveicolo,
      statistichePerAutista,
      serviziMensili
    }
  });
});

// @desc    Verifica conflitti calendario
// @route   POST /api/servizi/verifica-conflitti
// @access  Private
exports.verificaConflitti = asyncHandler(async (req, res, next) => {
  const { autoveicolo, autista, dataInizio, dataFine, servizioId } = req.body;

  if (!dataInizio || !dataFine) {
    return next(new ErrorResponse('Date di inizio e fine sono obbligatorie', 400));
  }

  const filter = {
    stato: { $nin: ['Annullato', 'Completato'] },
    $or: [
      {
        dataInizio: { $lte: new Date(dataFine) },
        dataFine: { $gte: new Date(dataInizio) }
      }
    ]
  };

  // Escludi il servizio corrente se stiamo modificando
  if (servizioId) {
    filter._id = { $ne: servizioId };
  }

  // Filtro per autoveicolo o autista
  if (autoveicolo || autista) {
    const orConditions = [];
    if (autoveicolo) orConditions.push({ autoveicolo });
    if (autista) orConditions.push({ autista });
    filter.$and = [{ $or: orConditions }];
  }

  const conflitti = await Servizio.find(filter)
    .populate('autoveicolo', 'targa marca modello')
    .populate('autista', 'nome cognome')
    .sort({ dataInizio: 1 });

  res.status(200).json({
    success: true,
    count: conflitti.length,
    conflitti: conflitti.length > 0,
    data: conflitti
  });
});

// @desc    Genera servizi ricorrenti
// @route   POST /api/servizi/:id/genera-ricorrenti
// @access  Private
exports.generaServiziRicorrenti = asyncHandler(async (req, res, next) => {
  const servizio = await Servizio.findById(req.params.id);

  if (!servizio) {
    return next(new ErrorResponse('Servizio non trovato', 404));
  }

  if (!servizio.ricorrenza || !servizio.ricorrenza.attiva) {
    return next(new ErrorResponse('Il servizio non ha ricorrenza attiva', 400));
  }

  const numeroOccorrenze = req.body.numeroOccorrenze || 10;
  const serviziDaCreare = await servizio.generaServiziRicorrenti(numeroOccorrenze);

  // Salva i servizi generati
  const serviziCreati = await Servizio.insertMany(serviziDaCreare);

  res.status(201).json({
    success: true,
    count: serviziCreati.length,
    data: serviziCreati
  });
});

module.exports = exports;