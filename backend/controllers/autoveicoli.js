// backend/controllers/autoveicoli.js - CONTROLLER COMPLETO CON PASS ZTL
const fs = require('fs');
const path = require('path');
const Autoveicolo = require('../models/Autoveicolo');
const { normalizePathForUrl } = require ('../middleware/fileUpload');
// Funzione helper per calcolare la prossima revisione basata sul tipo di carrozzeria
const calcolaProssimaRevisione = (autoveicolo) => {
  const intervalliRevisione = {
    'Autovettura': { anni: 4, poi: 2 },
    'Motoveicolo': { anni: 4, poi: 2 },
    'Van': { anni: 4, poi: 2 },
    'Cassonato': { anni: 1, poi: 1 },
    'Trattore stradale < 3.5 ton': { anni: 4, poi: 2 },
    'Trattore stradale > 3.5 ton': { anni: 1, poi: 1 },
    'Semirimorchio': { anni: 1, poi: 1 },
    'Rimorchio < 3.5 ton': { anni: 4, poi: 2 },
    'Rimorchio > 3.5 ton': { anni: 1, poi: 1 }
  };

  const dataImmatricolazione = new Date(autoveicolo.dataImmatricolazione);
  const ultimaRevisione = autoveicolo.ultimaRevisione ? new Date(autoveicolo.ultimaRevisione) : null;
  const intervallo = intervalliRevisione[autoveicolo.tipoCarrozzeria] || { anni: 2, poi: 2 };

  let prossimaRevisione;
  let tipoRevisione;

  if (ultimaRevisione) {
    prossimaRevisione = new Date(ultimaRevisione);
    prossimaRevisione.setFullYear(prossimaRevisione.getFullYear() + intervallo.poi);
    tipoRevisione = intervallo.poi === 1 ? 'Annuale' : 'Biennale/Quadriennale';
  } else {
    prossimaRevisione = new Date(dataImmatricolazione);
    prossimaRevisione.setFullYear(prossimaRevisione.getFullYear() + intervallo.anni);
    tipoRevisione = intervallo.anni === 1 ? 'Annuale' : (intervallo.anni === 4 ? 'Quadriennale' : 'Biennale');
  }

  return { data: prossimaRevisione, tipo: tipoRevisione };
};

// @desc    Get all autoveicoli with advanced pagination and search
// @route   GET /api/autoveicoli
// @access  Private
exports.getAutoveicoli = async (req, res) => {
  try {
    let query = {};

    // RICERCA AVANZATA
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { marca: searchRegex },
        { modello: searchRegex },
        { targa: searchRegex },
        { telaio: searchRegex },
        { autista: searchRegex },
        { compagniaAssicurazione: searchRegex },
        { numeroPolizzaAssicurazione: searchRegex },
        { note: searchRegex }
      ];
    }

    // FILTRI SPECIFICI
    if (req.query.stato) {
      query.stato = req.query.stato;
    }

    if (req.query.tipoCarrozzeria) {
      query.tipoCarrozzeria = req.query.tipoCarrozzeria;
    }

    if (req.query.tipologiaAcquisto) {
      query.tipologiaAcquisto = req.query.tipologiaAcquisto;
    }

    if (req.query.marca) {
      query.marca = new RegExp(req.query.marca, 'i');
    }

    if (req.query.autista) {
      query.autista = new RegExp(req.query.autista, 'i');
    }

    // FILTRI BOOLEANI
    if (req.query.esenteBollo !== undefined) {
      query.esenteBollo = req.query.esenteBollo === 'true';
    }

    if (req.query.passZTL !== undefined) {
      query.passZTL = req.query.passZTL === 'true';
    }

    if (req.query.conAutRifiuti !== undefined) {
      if (req.query.conAutRifiuti === 'true') {
        query.autRifiuti = { $exists: true, $ne: [] };
      }
    }

    // CONFIGURAZIONE PAGINAZIONE
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const maxLimit = 500;
    
    const finalLimit = Math.min(limit, maxLimit);
    const startIndex = (page - 1) * finalLimit;

    // ORDINAMENTO DINAMICO
    let sortOptions = {};
    if (req.query.sortBy) {
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sortOptions[req.query.sortBy] = sortOrder;
    } else {
      sortOptions = { 
        stato: 1,
        dataImmatricolazione: -1
      };
    }

    // ESECUZIONE QUERY
    const autoveicoli = await Autoveicolo.find(query)
      .sort(sortOptions)
      .limit(finalLimit)
      .skip(startIndex)
      .lean();

    const total = await Autoveicolo.countDocuments(query);

    // INFORMAZIONI PAGINAZIONE
    const totalPages = Math.ceil(total / finalLimit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: finalLimit,
      hasNextPage,
      hasPrevPage,
      startIndex: startIndex + 1,
      endIndex: Math.min(startIndex + finalLimit, total)
    };

    if (hasNextPage) {
      pagination.next = {
        page: page + 1,
        limit: finalLimit
      };
    }

    if (hasPrevPage) {
      pagination.prev = {
        page: page - 1,
        limit: finalLimit
      };
    }

    res.status(200).json({
      success: true,
      count: autoveicoli.length,
      total,
      pagination,
      filters: {
        search: req.query.search || null,
        stato: req.query.stato || null,
        tipoCarrozzeria: req.query.tipoCarrozzeria || null,
        tipologiaAcquisto: req.query.tipologiaAcquisto || null,
        esenteBollo: req.query.esenteBollo || null,
        passZTL: req.query.passZTL || null,
        conAutRifiuti: req.query.conAutRifiuti || null
      },
      sort: {
        sortBy: req.query.sortBy || 'stato,dataImmatricolazione',
        sortOrder: req.query.sortOrder || 'asc,desc'
      },
      data: autoveicoli
    });

  } catch (err) {
    console.error('Errore get autoveicoli:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Get single autoveicolo
// @route   GET /api/autoveicoli/:id
// @access  Private
exports.getAutoveicolo = async (req, res) => {
  try {
    const autoveicolo = await Autoveicolo.findById(req.params.id)
      .populate('iscrizioneANGA')
      .populate('autRifiuti');

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
exports.createAutoveicolo = async (req, res) => {
  try {
    const autoveicolo = await Autoveicolo.create(req.body);

    res.status(201).json({
      success: true,
      data: autoveicolo
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      details: err.errors
    });
  }
};

// @desc    Update autoveicolo
// @route   PUT /api/autoveicoli/:id
// @access  Private/Admin
exports.updateAutoveicolo = async (req, res) => {
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
exports.deleteAutoveicolo = async (req, res) => {
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
        await fs.promises.unlink(allegato.percorsoFile);
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

exports.uploadAllegati = async (req, res) => {
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

    const nuoviAllegati = req.files.map((file) => ({
      nomeFile: file.originalname,
      percorsoFile: normalizePathForUrl(file.path),
      tipo: req.body.tipo || 'Altro'
    }));

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
exports.deleteAllegato = async (req, res) => {
  try {
    const autoveicolo = await Autoveicolo.findById(req.params.id);

    if (!autoveicolo) {
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
      });
    }

    const allegato = autoveicolo.allegati.id(req.params.allegatoId);

    if (!allegato) {
      return res.status(404).json({
        success: false,
        message: 'Allegato non trovato'
      });
    }

    try {
      await fs.promises.unlink(allegato.percorsoFile);
    } catch (err) {
      console.error('Errore eliminazione file:', err.message);
    }

    autoveicolo.allegati.pull(req.params.allegatoId);
    await autoveicolo.save();

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

// @desc    Download allegato
// @route   GET /api/autoveicoli/:id/allegati/:allegatoId/download
// @access  Private
exports.downloadAllegato = async (req, res) => {
  try {
    const autoveicolo = await Autoveicolo.findById(req.params.id);

    if (!autoveicolo) {
      return res.status(404).json({
        success: false,
        message: 'Autoveicolo non trovato'
      });
    }

    const allegato = autoveicolo.allegati.id(req.params.allegatoId);

    if (!allegato) {
      return res.status(404).json({
        success: false,
        message: 'Allegato non trovato'
      });
    }

    if (!fs.existsSync(allegato.percorsoFile)) {
      return res.status(404).json({
        success: false,
        message: 'File fisico non trovato'
      });
    }

    const ext = path.extname(allegato.nomeFile).toLowerCase();
    
    switch (ext) {
    case '.pdf':
      res.header('Content-Type', 'application/pdf');
      break;
    case '.jpg':
    case '.jpeg':
      res.header('Content-Type', 'image/jpeg');
      break;
    case '.png':
      res.header('Content-Type', 'image/png');
      break;
    case '.doc':
      res.header('Content-Type', 'application/msword');
      break;
    case '.docx':
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      break;
    case '.xls':
      res.header('Content-Type', 'application/vnd.ms-excel');
      break;
    case '.xlsx':
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      break;
    default:
      res.header('Content-Type', 'application/octet-stream');
    }

    res.header('Content-Disposition', `attachment; filename="${allegato.nomeFile}"`);
    res.sendFile(path.resolve(allegato.percorsoFile));

  } catch (err) {
    console.error('Errore downloadAllegato:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server',
      details: err.message
    });
  }
};

// @desc    Get scadenze autoveicoli - AGGIORNATO CON PASS ZTL
// @route   GET /api/autoveicoli/scadenze/all
// @access  Private
exports.getScadenze = async (req, res) => {
  try {
    const query = req.query.includiGuasti === 'true' 
      ? { stato: { $in: ['Attivo', 'Veicolo Guasto'] } }
      : { stato: 'Attivo' };

    const autoveicoli = await Autoveicolo.find(query);

    const scadenze = {
      revisioni: [],
      bolli: [],
      assicurazioni: [],
      titoloProprieta: [],
      passZTL: []
    };

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    autoveicoli.forEach((auto) => {
      const skipScadenze = auto.stato === 'Veicolo Guasto' && req.query.includiGuasti !== 'true';

      if (!skipScadenze) {
        // Revisioni
        const revisioneInfo = calcolaProssimaRevisione(auto);
        const giorniRevisione = Math.floor(
          (revisioneInfo.data - oggi) / (1000 * 60 * 60 * 24)
        );
        if (giorniRevisione <= 30) {
          scadenze.revisioni.push({
            autoveicolo: auto,
            data: revisioneInfo.data,
            urgent: giorniRevisione <= 0,
            giorni: giorniRevisione,
            tipoRevisione: revisioneInfo.tipo
          });
        }

        // Bolli (solo se non esente)
        if (auto.dataScadenzaBollo && !auto.esenteBollo) {
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
        }

        // Assicurazioni
        if (auto.dataScadenzaAssicurazione) {
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
        }

        // Titolo Proprietà
        if (auto.scadenzaTitoloProprietà) {
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
      }

      // Pass ZTL - Controlliamo sempre, anche per veicoli guasti
      if (auto.passZTL && auto.dataScadenzaPassZTL) {
        const giorniPassZTL = Math.floor(
          (auto.dataScadenzaPassZTL - oggi) / (1000 * 60 * 60 * 24)
        );
        if (giorniPassZTL <= 60) {
          scadenze.passZTL.push({
            autoveicolo: auto,
            data: auto.dataScadenzaPassZTL,
            urgent: giorniPassZTL <= 0,
            giorni: giorniPassZTL,
            statoVeicolo: auto.stato,
            livelloUrgenza: giorniPassZTL <= 0 ? 'scaduto' : 
              giorniPassZTL <= 7 ? 'critico' :
                giorniPassZTL <= 30 ? 'urgente' : 'avviso'
          });
        }
      }
    });

    Object.keys(scadenze).forEach((key) => {
      scadenze[key].sort((a, b) => a.data - b.data);
    });

    const statistiche = {
      totaleScadenze: Object.values(scadenze).reduce((total, categoria) => total + categoria.length, 0),
      scadute: Object.values(scadenze).reduce((total, categoria) => 
        total + categoria.filter(item => item.urgent).length, 0
      ),
      passZTL: {
        totale: scadenze.passZTL.length,
        scaduti: scadenze.passZTL.filter(item => item.livelloUrgenza === 'scaduto').length,
        critici: scadenze.passZTL.filter(item => item.livelloUrgenza === 'critico').length,
        urgenti: scadenze.passZTL.filter(item => item.livelloUrgenza === 'urgente').length,
        avvisi: scadenze.passZTL.filter(item => item.livelloUrgenza === 'avviso').length
      }
    };

    res.status(200).json({
      success: true,
      data: scadenze,
      statistiche,
      parametri: {
        includiGuasti: req.query.includiGuasti === 'true',
        dataControllo: oggi
      }
    });
  } catch (err) {
    console.error('Errore get scadenze:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Get scadenze Pass ZTL specifiche
// @route   GET /api/autoveicoli/scadenze/pass-ztl
// @access  Private
exports.getScadenzePassZTL = async (req, res) => {
  try {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const autoveicoli = await Autoveicolo.find({
      passZTL: true,
      dataScadenzaPassZTL: { $exists: true }
    }).select('marca modello targa passZTL dataScadenzaPassZTL stato autista');

    const scadenzePassZTL = autoveicoli.map(auto => {
      const giorni = Math.floor(
        (auto.dataScadenzaPassZTL - oggi) / (1000 * 60 * 60 * 24)
      );

      return {
        autoveicolo: auto,
        data: auto.dataScadenzaPassZTL,
        giorni,
        urgent: giorni <= 0,
        livelloUrgenza: giorni <= 0 ? 'scaduto' : 
          giorni <= 7 ? 'critico' :
            giorni <= 30 ? 'urgente' : 'normale',
        messaggio: giorni <= 0 ? 'Pass ZTL SCADUTO' :
          giorni <= 7 ? `Pass ZTL scade tra ${giorni} giorni - CRITICO` :
            giorni <= 30 ? `Pass ZTL scade tra ${giorni} giorni` :
              `Pass ZTL scade tra ${giorni} giorni`
      };
    });

    scadenzePassZTL.sort((a, b) => {
      if (a.urgent !== b.urgent) return b.urgent - a.urgent;
      return a.data - b.data;
    });

    res.status(200).json({
      success: true,
      count: scadenzePassZTL.length,
      data: scadenzePassZTL,
      statistiche: {
        scaduti: scadenzePassZTL.filter(item => item.livelloUrgenza === 'scaduto').length,
        critici: scadenzePassZTL.filter(item => item.livelloUrgenza === 'critico').length,
        urgenti: scadenzePassZTL.filter(item => item.livelloUrgenza === 'urgente').length,
        normali: scadenzePassZTL.filter(item => item.livelloUrgenza === 'normale').length
      }
    });

  } catch (err) {
    console.error('Errore get scadenze Pass ZTL:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Update stato autoveicolo
// @route   PUT /api/autoveicoli/:id/stato
// @access  Private/Admin
exports.updateStato = async (req, res) => {
  try {
    const { stato } = req.body;

    if (!['Attivo', 'Venduto', 'Demolito', 'Chiuso', 'Veicolo Guasto'].includes(stato)) {
      return res.status(400).json({
        success: false,
        message: 'Stato non valido'
      });
    }

    const autoveicolo = await Autoveicolo.findByIdAndUpdate(
      req.params.id,
      { stato },
      { new: true, runValidators: true }
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
exports.demolisciAutoveicolo = async (req, res) => {
  try {
    const { dataDemolizione, datiDemolitore } = req.body;

    const autoveicolo = await Autoveicolo.findByIdAndUpdate(
      req.params.id,
      {
        stato: 'Demolito',
        dataDemolizione: new Date(dataDemolizione),
        datiDemolitore
      },
      { new: true, runValidators: true }
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
exports.vendiAutoveicolo = async (req, res) => {
  try {
    const autoveicolo = await Autoveicolo.findByIdAndUpdate(
      req.params.id,
      {
        stato: 'Venduto',
        dataVendita: new Date()
      },
      { new: true, runValidators: true }
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