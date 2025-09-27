// backend/controllers/manutenzioni.js - VERSIONE CORRETTA
const Manutenzione = require('../models/Manutenzione');
const Autoveicolo = require('../models/Autoveicolo');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const path = require('path');
const fs = require('fs');

// @desc    Get all manutenzioni
// @route   GET /api/manutenzioni
// @access  Private
exports.getManutenzioni = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  if (req.query.autoveicolo) {
    filter.autoveicolo = req.query.autoveicolo;
  }
  
  if (req.query.stato) {
    filter.stato = req.query.stato;
  }
  
  if (req.query.tipoManutenzione) {
    filter.tipoManutenzione = req.query.tipoManutenzione;
  }
  
  if (req.query.priorita) {
    filter.priorita = req.query.priorita;
  }

  if (req.query.dataInizio && req.query.dataFine) {
    filter.dataProgrammata = {
      $gte: new Date(req.query.dataInizio),
      $lte: new Date(req.query.dataFine)
    };
  }

  // Search functionality
  if (req.query.search) {
    filter.$or = [
      { descrizione: { $regex: req.query.search, $options: 'i' } },
      { note: { $regex: req.query.search, $options: 'i' } },
      { 'fornitore.nome': { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const total = await Manutenzione.countDocuments(filter);
  
  const manutenzioni = await Manutenzione.find(filter)
    .populate({
      path: 'autoveicolo',
      select: 'targa marca modello tipoCarrozzeria'
    })
    .populate('createdBy', 'nome email')
    .populate('updatedBy', 'nome email')
    .sort({ dataProgrammata: -1 })
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
    count: manutenzioni.length,
    total,
    pagination,
    data: manutenzioni
  });
});

// @desc    Get single manutenzione
// @route   GET /api/manutenzioni/:id
// @access  Private
exports.getManutenzione = asyncHandler(async (req, res, next) => {
  const manutenzione = await Manutenzione.findById(req.params.id)
    .populate({
      path: 'autoveicolo',
      select: 'targa marca modello tipoCarrozzeria dataImmatricolazione'
    })
    .populate('createdBy', 'nome email')
    .populate('updatedBy', 'nome email');

  if (!manutenzione) {
    return next(new ErrorResponse('Manutenzione non trovata', 404));
  }

  res.status(200).json({
    success: true,
    data: manutenzione
  });
});

// @desc    Create manutenzione
// @route   POST /api/manutenzioni
// @access  Private
exports.createManutenzione = asyncHandler(async (req, res, next) => {
  // Verifica che l'autoveicolo esista
  const autoveicolo = await Autoveicolo.findById(req.body.autoveicolo);
  if (!autoveicolo) {
    return next(new ErrorResponse('Autoveicolo non trovato', 404));
  }

  // Aggiungi l'utente che crea (se disponibile)
  if (req.user) {
    req.body.createdBy = req.user.id;
  }

  const manutenzione = await Manutenzione.create(req.body);
  
  await manutenzione.populate({
    path: 'autoveicolo',
    select: 'targa marca modello tipoCarrozzeria'
  });

  res.status(201).json({
    success: true,
    data: manutenzione
  });
});

// @desc    Update manutenzione
// @route   PUT /api/manutenzioni/:id
// @access  Private
exports.updateManutenzione = asyncHandler(async (req, res, next) => {
  let manutenzione = await Manutenzione.findById(req.params.id);

  if (!manutenzione) {
    return next(new ErrorResponse('Manutenzione non trovata', 404));
  }

  // Aggiungi l'utente che modifica (se disponibile)
  if (req.user) {
    req.body.updatedBy = req.user.id;
  }

  manutenzione = await Manutenzione.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate({
    path: 'autoveicolo',
    select: 'targa marca modello tipoCarrozzeria'
  });

  res.status(200).json({
    success: true,
    data: manutenzione
  });
});

// @desc    Delete manutenzione
// @route   DELETE /api/manutenzioni/:id
// @access  Private
exports.deleteManutenzione = asyncHandler(async (req, res, next) => {
  const manutenzione = await Manutenzione.findById(req.params.id);

  if (!manutenzione) {
    return next(new ErrorResponse('Manutenzione non trovata', 404));
  }

  // Elimina i file allegati
  if (manutenzione.allegati && manutenzione.allegati.length > 0) {
    manutenzione.allegati.forEach(allegato => {
      try {
        const filePath = path.resolve(allegato.percorsoFile);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('Errore eliminazione file:', error);
      }
    });
  }

  await manutenzione.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Manutenzione eliminata con successo'
  });
});

// @desc    Upload allegati for manutenzione
// @route   POST /api/manutenzioni/:id/allegati
// @access  Private
exports.uploadAllegati = asyncHandler(async (req, res, next) => {
  const manutenzione = await Manutenzione.findById(req.params.id);

  if (!manutenzione) {
    return next(new ErrorResponse('Manutenzione non trovata', 404));
  }

  if (!req.files || req.files.length === 0) {
    return next(new ErrorResponse('Nessun file caricato', 400));
  }

  const tipoAllegato = req.body.tipo || 'Altro';
  const allegatiCaricati = [];

  req.files.forEach(file => {
    allegatiCaricati.push({
      nomeFile: file.originalname,
      percorsoFile: file.path,
      tipo: tipoAllegato,
      dataCaricamento: new Date()
    });
  });

  manutenzione.allegati.push(...allegatiCaricati);
  await manutenzione.save();

  res.status(200).json({
    success: true,
    data: allegatiCaricati
  });
});

// @desc    Delete allegato
// @route   DELETE /api/manutenzioni/:id/allegati/:allegatoId
// @access  Private
exports.deleteAllegato = asyncHandler(async (req, res, next) => {
  const manutenzione = await Manutenzione.findById(req.params.id);

  if (!manutenzione) {
    return next(new ErrorResponse('Manutenzione non trovata', 404));
  }

  const allegato = manutenzione.allegati.id(req.params.allegatoId);
  
  if (!allegato) {
    return next(new ErrorResponse('Allegato non trovato', 404));
  }

  // Elimina il file fisico
  try {
    const filePath = path.resolve(allegato.percorsoFile);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Errore eliminazione file:', error);
  }

  // Rimuovi l'allegato dal database
  allegato.deleteOne();
  await manutenzione.save();

  res.status(200).json({
    success: true,
    message: 'Allegato eliminato con successo'
  });
});

// @desc    Get manutenzioni scadenze
// @route   GET /api/manutenzioni/scadenze
// @access  Private
exports.getScadenze = asyncHandler(async (req, res, next) => {
  const oggi = new Date();
  const unMese = new Date(oggi.getTime() + 30 * 24 * 60 * 60 * 1000);
  const treGiorni = new Date(oggi.getTime() + 3 * 24 * 60 * 60 * 1000);

  const scaduteEUrgenti = await Manutenzione.find({
    stato: { $in: ['Programmata', 'In corso'] },
    $or: [
      { dataProgrammata: { $lt: oggi } },
      { priorita: 'Urgente' }
    ]
  }).populate('autoveicolo', 'targa marca modello');

  const prossimeScadenze = await Manutenzione.find({
    stato: 'Programmata',
    dataProgrammata: { $gte: oggi, $lte: unMese }
  }).populate('autoveicolo', 'targa marca modello');

  const prossimiTreGiorni = await Manutenzione.find({
    stato: 'Programmata',
    dataProgrammata: { $gte: oggi, $lte: treGiorni }
  }).populate('autoveicolo', 'targa marca modello');

  res.status(200).json({
    success: true,
    data: {
      scaduteEUrgenti,
      prossimeScadenze,
      prossimiTreGiorni
    }
  });
});

// @desc    Get statistiche manutenzioni
// @route   GET /api/manutenzioni/statistiche
// @access  Private
exports.getStatistiche = asyncHandler(async (req, res, next) => {
  const anno = req.query.anno || new Date().getFullYear();
  const inizioAnno = new Date(anno, 0, 1);
  const fineAnno = new Date(anno, 11, 31);

  const statistichePerTipo = await Manutenzione.aggregate([
    {
      $match: {
        dataEsecuzione: { $gte: inizioAnno, $lte: fineAnno },
        stato: 'Completata'
      }
    },
    {
      $group: {
        _id: '$tipoManutenzione',
        count: { $sum: 1 },
        costoTotale: {
          $sum: {
            $add: [
              '$costi.manodopera',
              '$costi.ricambi',
              '$costi.altri',
              {
                $multiply: [
                  { $add: ['$costi.manodopera', '$costi.ricambi', '$costi.altri'] },
                  { $divide: ['$costi.iva', 100] }
                ]
              }
            ]
          }
        }
      }
    }
  ]);

  const statistichePerFornitore = await Manutenzione.aggregate([
    {
      $match: {
        dataEsecuzione: { $gte: inizioAnno, $lte: fineAnno },
        stato: 'Completata'
      }
    },
    {
      $group: {
        _id: '$fornitore.nome',
        count: { $sum: 1 },
        costoTotale: {
          $sum: {
            $add: [
              '$costi.manodopera',
              '$costi.ricambi',
              '$costi.altri',
              {
                $multiply: [
                  { $add: ['$costi.manodopera', '$costi.ricambi', '$costi.altri'] },
                  { $divide: ['$costi.iva', 100] }
                ]
              }
            ]
          }
        }
      }
    },
    { $sort: { costoTotale: -1 } },
    { $limit: 10 }
  ]);

  const statistichePerAutoveicolo = await Manutenzione.aggregate([
    {
      $match: {
        dataEsecuzione: { $gte: inizioAnno, $lte: fineAnno },
        stato: 'Completata'
      }
    },
    {
      $group: {
        _id: '$autoveicolo',
        count: { $sum: 1 },
        costoTotale: {
          $sum: {
            $add: [
              '$costi.manodopera',
              '$costi.ricambi',
              '$costi.altri',
              {
                $multiply: [
                  { $add: ['$costi.manodopera', '$costi.ricambi', '$costi.altri'] },
                  { $divide: ['$costi.iva', 100] }
                ]
              }
            ]
          }
        }
      }
    },
    { $sort: { costoTotale: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'autoveicolis',
        localField: '_id',
        foreignField: '_id',
        as: 'autoveicolo'
      }
    },
    { $unwind: '$autoveicolo' }
  ]);

  const costiMensili = await Manutenzione.aggregate([
    {
      $match: {
        dataEsecuzione: { $gte: inizioAnno, $lte: fineAnno },
        stato: 'Completata'
      }
    },
    {
      $group: {
        _id: { $month: '$dataEsecuzione' },
        costoTotale: {
          $sum: {
            $add: [
              '$costi.manodopera',
              '$costi.ricambi',
              '$costi.altri',
              {
                $multiply: [
                  { $add: ['$costi.manodopera', '$costi.ricambi', '$costi.altri'] },
                  { $divide: ['$costi.iva', 100] }
                ]
              }
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      statistichePerTipo,
      statistichePerFornitore,
      statistichePerAutoveicolo,
      costiMensili
    }
  });
});