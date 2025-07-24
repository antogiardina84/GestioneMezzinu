// backend/controllers/dashboard.js - VERSIONE AGGIORNATA
const Autoveicolo = require('../models/Autoveicolo');
const AlboGestori = require('../models/AlboGestori');
const REN = require('../models/REN');

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

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res, _next) => {
  try {
    const oggi = new Date();
    const unMese = new Date(oggi.getTime() + 30 * 24 * 60 * 60 * 1000);
    const seiMesi = new Date(oggi.getTime() + 180 * 24 * 60 * 60 * 1000);

    // Riepilogo mezzi
    const riepilogoMezzi = await Autoveicolo.aggregate([
      {
        $group: {
          _id: '$stato',
          count: { $sum: 1 }
        }
      }
    ]);

    const mezziAttivi = await Autoveicolo.find({ stato: 'Attivo' });

    // Revisioni in scadenza - Nuova logica basata sul tipo di carrozzeria
    const revisioni = [];
    mezziAttivi.forEach((auto) => {
      const prossimaRevisione = calcolaProssimaRevisione(auto);
      const intervalli = auto.getIntervallorevisione();

      // Determina il periodo di controllo in base al tipo di veicolo
      let periodoControllo;
      if (intervalli.revisioniSuccessive === 1) {
        // Per revisioni annuali, controllo 2 mesi prima
        periodoControllo = new Date(oggi.getTime() + 60 * 24 * 60 * 60 * 1000);
      } else {
        // Per revisioni biennali, controllo 6 mesi prima
        periodoControllo = seiMesi;
      }

      if (prossimaRevisione <= periodoControllo) {
        revisioni.push({
          autoveicoloId: auto._id,
          targa: auto.targa,
          marca: auto.marca,
          modello: auto.modello,
          tipoCarrozzeria: auto.tipoCarrozzeria,
          dataScadenza: prossimaRevisione,
          tipoRevisione: intervalli.revisioniSuccessive === 1 ? 'Annuale' : 'Biennale',
          giorniRimanenti: Math.ceil((prossimaRevisione - oggi) / (1000 * 60 * 60 * 24))
        });
      }
    });

    // Bolli in scadenza - AGGIORNATO per gestire esenzioni
    const bolliInScadenza = [];
    mezziAttivi.forEach((auto) => {
      // Solo se non è esente dal bollo e ha una data di scadenza
      if (!auto.esenteBollo && auto.dataScadenzaBollo) {
        const scadenzaBollo = new Date(auto.dataScadenzaBollo);
        if (scadenzaBollo <= unMese) {
          bolliInScadenza.push({
            autoveicoloId: auto._id,
            targa: auto.targa,
            marca: auto.marca,
            modello: auto.modello,
            dataScadenza: scadenzaBollo,
            giorniRimanenti: Math.ceil((scadenzaBollo - oggi) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });

    // Assicurazioni in scadenza
    const assicurazioniInScadenza = [];
    mezziAttivi.forEach((auto) => {
      const scadenzaAssicurazione = new Date(auto.dataScadenzaAssicurazione);
      if (scadenzaAssicurazione <= unMese) {
        assicurazioniInScadenza.push({
          autoveicoloId: auto._id,
          targa: auto.targa,
          marca: auto.marca,
          modello: auto.modello,
          compagnia: auto.compagniaAssicurazione,
          numeroPolizza: auto.numeroPolizzaAssicurazione,
          dataScadenza: scadenzaAssicurazione,
          giorniRimanenti: Math.ceil((scadenzaAssicurazione - oggi) / (1000 * 60 * 60 * 1000))
        });
      }
    });

    // Titoli di proprietà in scadenza - AGGIORNATO
    const titoliProprietaInScadenza = [];
    mezziAttivi.forEach((auto) => {
      if (auto.scadenzaTitoloProprietà) {
        const scadenzaTitolo = new Date(auto.scadenzaTitoloProprietà);
        if (scadenzaTitolo <= unMese) {
          titoliProprietaInScadenza.push({
            autoveicoloId: auto._id,
            targa: auto.targa,
            marca: auto.marca,
            modello: auto.modello,
            tipologiaAcquisto: auto.tipologiaAcquisto,
            dataScadenza: scadenzaTitolo,
            giorniRimanenti: Math.ceil((scadenzaTitolo - oggi) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });

    // Albo Gestori in scadenza
    const alboGestoriInScadenza = await AlboGestori.find({
      dataScadenzaIscrizione: { $lte: unMese }
    }).select('numeroIscrizioneAlbo regione dataScadenzaIscrizione');

    const angaInScadenza = alboGestoriInScadenza.map(albo => ({
      alboId: albo._id,
      numeroIscrizione: albo.numeroIscrizioneAlbo,
      regione: albo.regione,
      dataScadenza: albo.dataScadenzaIscrizione,
      giorniRimanenti: Math.ceil((new Date(albo.dataScadenzaIscrizione) - oggi) / (1000 * 60 * 60 * 24))
    }));

    // REN in scadenza
    const renInScadenza = await REN.find({
      dataScadenzaREN: { $lte: unMese }
    }).select('numeroIscrizioneREN regione dataScadenzaREN');

    const renScadenze = renInScadenza.map(ren => ({
      renId: ren._id,
      numeroIscrizione: ren.numeroIscrizioneREN,
      regione: ren.regione,
      dataScadenza: ren.dataScadenzaREN,
      giorniRimanenti: Math.ceil((new Date(ren.dataScadenzaREN) - oggi) / (1000 * 60 * 60 * 24))
    }));

    // Preparazione dati di riepilogo
    const mezziPerStato = riepilogoMezzi.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Contatori aggiornati
    const contatori = {
      mezziTotali: mezziAttivi.length,
      mezziAttivi: mezziPerStato['Attivo'] || 0,
      mezziChiusi: mezziPerStato['Chiuso'] || 0,
      mezziVenduti: mezziPerStato['Venduto'] || 0,
      mezziDemoliti: mezziPerStato['Demolito'] || 0,
      revisioniInScadenza: revisioni.length,
      bolliInScadenza: bolliInScadenza.length,
      assicurazioniInScadenza: assicurazioniInScadenza.length,
      titoliProprietaInScadenza: titoliProprietaInScadenza.length, // NUOVO
      angaInScadenza: angaInScadenza.length,
      renInScadenza: renScadenze.length
    };

    // Statistiche aggiuntive sui nuovi campi
    const statisticheAggiuntive = {
      // Mezzi con Pass ZTL
      mezziConPassZTL: await Autoveicolo.countDocuments({ 
        stato: 'Attivo', 
        passZTL: true 
      }),
      
      // Mezzi esenti dal bollo
      mezziEsentiBollo: await Autoveicolo.countDocuments({ 
        stato: 'Attivo', 
        esenteBollo: true 
      }),
      
      // Distribuzione per tipologia acquisto
      distribuzioneTipologiaAcquisto: await Autoveicolo.aggregate([
        { $match: { stato: 'Attivo' } },
        {
          $group: {
            _id: '$tipologiaAcquisto',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Mezzi con autorizzazioni rifiuti
      mezziConAutRifiuti: await Autoveicolo.countDocuments({ 
        stato: 'Attivo', 
        autRifiuti: { $exists: true, $not: { $size: 0 } }
      }),
      
      // Distribuzione per tipo carrozzeria
      distribuzioneTipoCarrozzeria: await Autoveicolo.aggregate([
        { $match: { stato: 'Attivo' } },
        {
          $group: {
            _id: '$tipoCarrozzeria',
            count: { $sum: 1 }
          }
        }
      ])
    };

    // Risposta finale con tutti i dati
    const dashboardData = {
      contatori,
      statisticheAggiuntive,
      riepilogoMezzi: mezziPerStato,
      revisioni: revisioni.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)),
      bolli: bolliInScadenza.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)),
      assicurazioni: assicurazioniInScadenza.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)),
      titoliProprieta: titoliProprietaInScadenza.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)), // NUOVO
      anga: angaInScadenza.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)),
      ren: renScadenze.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza))
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Errore nel caricamento dati dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel caricamento dei dati dashboard'
    });
  }
};

// @desc    Get mezzi statistics
// @route   GET /api/dashboard/mezzi-stats  
// @access  Private
const getMezziStats = async (req, res) => {
  try {
    // Statistiche dettagliate sui mezzi attivi
    const mezziAttivi = await Autoveicolo.find({ stato: 'Attivo' });
    
    const stats = {
      // Statistiche generali
      totale: mezziAttivi.length,
      conPassZTL: mezziAttivi.filter(m => m.passZTL).length,
      esentiBollo: mezziAttivi.filter(m => m.esenteBollo).length,
      conAutRifiuti: mezziAttivi.filter(m => m.autRifiuti && m.autRifiuti.length > 0).length,
      
      // Distribuzione per tipologia acquisto
      tipologiaAcquisto: {
        proprieta: mezziAttivi.filter(m => m.tipologiaAcquisto === 'Proprietà').length,
        leasing: mezziAttivi.filter(m => m.tipologiaAcquisto === 'Leasing').length,
        noleggio: mezziAttivi.filter(m => m.tipologiaAcquisto === 'Noleggio').length
      },
      
      // Distribuzione per tipo carrozzeria
      tipoCarrozzeria: mezziAttivi.reduce((acc, mezzo) => {
        const tipo = mezzo.tipoCarrozzeria;
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {}),
      
      // Mezzi con autista assegnato
      conAutista: mezziAttivi.filter(m => m.autista && m.autista.trim() !== '').length,
      
      // Media portata massima (dove applicabile)
      portataMediaTon: mezziAttivi
        .filter(m => m.portataMax && m.portataMax > 0)
        .reduce((sum, m, _, arr) => sum + m.portataMax / arr.length, 0).toFixed(2)
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Errore nel caricamento statistiche mezzi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel caricamento delle statistiche mezzi'
    });
  }
};

// Esportazione corretta delle funzioni
module.exports = {
  getDashboardData,
  getMezziStats
};