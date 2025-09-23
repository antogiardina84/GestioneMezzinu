// backend/controllers/dashboard.js - VERSIONE AGGIORNATA CON PASS ZTL
const Autoveicolo = require('../models/Autoveicolo');
const AlboGestori = require('../models/AlboGestori');
const REN = require('../models/REN');

// Funzione helper per calcolare la prossima revisione basata sul tipo di carrozzeria
const calcolaProssimaRevisione = (autoveicolo) => {
  const intervalli = autoveicolo.getIntervallorevisione();

  if (autoveicolo.ultimaRevisione) {
    const ultimaRevisionData = new Date(autoveicolo.ultimaRevisione);
    const prossima = new Date(ultimaRevisionData);
    prossima.setFullYear(
      ultimaRevisionData.getFullYear() + intervalli.revisioniSuccessive
    );
    return prossima;
  } else {
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
exports.getDashboardData = async (req, res, _next) => {
  try {
    const oggi = new Date();
    const unMese = new Date(oggi.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dueMesi = new Date(oggi.getTime() + 60 * 24 * 60 * 60 * 1000);
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

    const mezziAttivi = await Autoveicolo.find({ 
      stato: { $in: ['Attivo'] }
    });

    const tuttiMezzi = await Autoveicolo.find({});

    // Revisioni in scadenza
    const revisioni = [];
    mezziAttivi.forEach((auto) => {
      const prossimaRevisione = calcolaProssimaRevisione(auto);
      const intervalli = auto.getIntervallorevisione();

      let periodoControllo;
      if (intervalli.revisioniSuccessive === 1) {
        periodoControllo = dueMesi;
      } else {
        periodoControllo = seiMesi;
      }

      if (prossimaRevisione <= periodoControllo) {
        const giorniRimanenti = Math.ceil((prossimaRevisione - oggi) / (1000 * 60 * 60 * 24));
        revisioni.push({
          autoveicolo: {
            _id: auto._id,
            targa: auto.targa,
            marca: auto.marca,
            modello: auto.modello,
            tipoCarrozzeria: auto.tipoCarrozzeria
          },
          dataRevisione: prossimaRevisione,
          urgent: giorniRimanenti <= 0,
          giorni: giorniRimanenti,
          tipoRevisione: intervalli.revisioniSuccessive === 1 ? 'Annuale' : 'Biennale'
        });
      }
    });

    // Bolli in scadenza
    const bolliInScadenza = [];
    mezziAttivi.forEach((auto) => {
      if (!auto.esenteBollo && auto.dataScadenzaBollo) {
        const scadenzaBollo = new Date(auto.dataScadenzaBollo);
        if (scadenzaBollo <= unMese) {
          const giorniRimanenti = Math.ceil((scadenzaBollo - oggi) / (1000 * 60 * 60 * 24));
          bolliInScadenza.push({
            autoveicolo: {
              _id: auto._id,
              targa: auto.targa,
              marca: auto.marca,
              modello: auto.modello
            },
            dataScadenza: scadenzaBollo,
            urgent: giorniRimanenti <= 0,
            giorni: giorniRimanenti
          });
        }
      }
    });

    // Assicurazioni in scadenza
    const assicurazioniInScadenza = [];
    mezziAttivi.forEach((auto) => {
      const scadenzaAssicurazione = new Date(auto.dataScadenzaAssicurazione);
      if (scadenzaAssicurazione <= unMese) {
        const giorniRimanenti = Math.ceil((scadenzaAssicurazione - oggi) / (1000 * 60 * 60 * 24));
        assicurazioniInScadenza.push({
          autoveicolo: {
            _id: auto._id,
            targa: auto.targa,
            marca: auto.marca,
            modello: auto.modello
          },
          dataScadenza: scadenzaAssicurazione,
          urgent: giorniRimanenti <= 0,
          giorni: giorniRimanenti,
          tolleranza: giorniRimanenti < 15
        });
      }
    });

    // Titoli di proprietà in scadenza
    const titoliProprietaInScadenza = [];
    mezziAttivi.forEach((auto) => {
      if (auto.scadenzaTitoloProprietà) {
        const scadenzaTitolo = new Date(auto.scadenzaTitoloProprietà);
        if (scadenzaTitolo <= unMese) {
          const giorniRimanenti = Math.ceil((scadenzaTitolo - oggi) / (1000 * 60 * 60 * 24));
          titoliProprietaInScadenza.push({
            autoveicolo: {
              _id: auto._id,
              targa: auto.targa,
              marca: auto.marca,
              modello: auto.modello,
              tipologiaAcquisto: auto.tipologiaAcquisto
            },
            dataScadenza: scadenzaTitolo,
            urgent: giorniRimanenti <= 0,
            giorni: giorniRimanenti
          });
        }
      }
    });

    // NUOVO: Pass ZTL in scadenza
    const passZTLInScadenza = [];
    // Controlliamo tutti i mezzi con Pass ZTL, anche quelli guasti per monitoraggio
    const mezziConPassZTL = await Autoveicolo.find({
      passZTL: true,
      dataScadenzaPassZTL: { $exists: true }
    });

    mezziConPassZTL.forEach((auto) => {
      const scadenzaPassZTL = new Date(auto.dataScadenzaPassZTL);
      const giorniRimanenti = Math.ceil((scadenzaPassZTL - oggi) / (1000 * 60 * 60 * 24));
      
      // Alert Pass ZTL con 60 giorni di anticipo
      if (giorniRimanenti <= 60) {
        let livelloUrgenza, messaggio;
        
        if (giorniRimanenti <= 0) {
          livelloUrgenza = 'scaduto';
          messaggio = 'Pass ZTL SCADUTO';
        } else if (giorniRimanenti <= 7) {
          livelloUrgenza = 'critico';
          messaggio = `Scade tra ${giorniRimanenti} giorni - CRITICO`;
        } else if (giorniRimanenti <= 30) {
          livelloUrgenza = 'urgente';
          messaggio = `Scade tra ${giorniRimanenti} giorni`;
        } else {
          livelloUrgenza = 'avviso';
          messaggio = `Scade tra ${giorniRimanenti} giorni`;
        }

        passZTLInScadenza.push({
          autoveicolo: {
            _id: auto._id,
            targa: auto.targa,
            marca: auto.marca,
            modello: auto.modello,
            autista: auto.autista,
            stato: auto.stato
          },
          dataScadenza: scadenzaPassZTL,
          urgent: giorniRimanenti <= 0,
          giorni: giorniRimanenti,
          livelloUrgenza,
          messaggio
        });
      }
    });

    // Albo Gestori in scadenza
    const alboGestoriInScadenza = await AlboGestori.find({
      dataScadenzaIscrizione: { $lte: unMese }
    }).select('numeroIscrizioneAlbo categoria classe dataScadenzaIscrizione');

    const angaInScadenza = alboGestoriInScadenza.map(albo => {
      const giorniRimanenti = Math.ceil((new Date(albo.dataScadenzaIscrizione) - oggi) / (1000 * 60 * 60 * 24));
      return {
        alboGestore: {
          _id: albo._id,
          numeroIscrizione: albo.numeroIscrizioneAlbo,
          categoria: albo.categoria,
          classe: albo.classe
        },
        dataScadenza: albo.dataScadenzaIscrizione,
        urgent: giorniRimanenti <= 0,
        giorni: giorniRimanenti
      };
    });

    // REN in scadenza
    const renInScadenza = await REN.find({
      dataScadenzaREN: { $lte: unMese }
    }).select('numeroIscrizioneREN regione provincia dataScadenzaREN');

    const renScadenze = renInScadenza.map(ren => {
      const giorniRimanenti = Math.ceil((new Date(ren.dataScadenzaREN) - oggi) / (1000 * 60 * 60 * 24));
      return {
        ren: {
          _id: ren._id,
          numeroIscrizione: ren.numeroIscrizioneREN,
          regione: ren.regione,
          provincia: ren.provincia
        },
        dataScadenza: ren.dataScadenzaREN,
        urgent: giorniRimanenti <= 0,
        giorni: giorniRimanenti
      };
    });

    // Preparazione dati di riepilogo
    const mezziPerStato = riepilogoMezzi.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Contatori aggiornati con Pass ZTL
    const contatori = {
      mezziTotali: tuttiMezzi.length,
      mezziAttivi: mezziPerStato['Attivo'] || 0,
      mezziGuasti: mezziPerStato['Veicolo Guasto'] || 0,
      mezziChiusi: mezziPerStato['Chiuso'] || 0,
      mezziVenduti: mezziPerStato['Venduto'] || 0,
      mezziDemoliti: mezziPerStato['Demolito'] || 0,
      revisioniInScadenza: revisioni.length,
      bolliInScadenza: bolliInScadenza.length,
      assicurazioniInScadenza: assicurazioniInScadenza.length,
      titoliProprietaInScadenza: titoliProprietaInScadenza.length,
      passZTLInScadenza: passZTLInScadenza.length, // NUOVO
      angaInScadenza: angaInScadenza.length,
      renInScadenza: renScadenze.length
    };

    // Risposta finale con Pass ZTL incluso
    const dashboardData = {
      riepilogoMezzi,
      contatori,
      revisioni: revisioni.sort((a, b) => new Date(a.dataRevisione) - new Date(b.dataRevisione)),
      bolliInScadenza: bolliInScadenza.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)),
      assicurazioniInScadenza: assicurazioniInScadenza.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)),
      titoliProprietaInScadenza: titoliProprietaInScadenza.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)),
      passZTLInScadenza: passZTLInScadenza.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)), // NUOVO
      angaInScadenza: angaInScadenza.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)),
      renInScadenza: renScadenze.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza))
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
// @route   GET /api/dashboard/statistics  
// @access  Private
exports.getStatistics = async (req, res) => {
  try {
    const mezziAttivi = await Autoveicolo.find({ stato: 'Attivo' });
    
    const stats = {
      totale: mezziAttivi.length,
      conPassZTL: mezziAttivi.filter(m => m.passZTL).length,
      esentiBollo: mezziAttivi.filter(m => m.esenteBollo).length,
      conAutRifiuti: mezziAttivi.filter(m => m.autRifiuti && m.autRifiuti.length > 0).length,
      
      tipologiaAcquisto: {
        proprieta: mezziAttivi.filter(m => m.tipologiaAcquisto === 'Proprietà').length,
        leasing: mezziAttivi.filter(m => m.tipologiaAcquisto === 'Leasing').length,
        noleggio: mezziAttivi.filter(m => m.tipologiaAcquisto === 'Noleggio').length
      },
      
      tipoCarrozzeria: mezziAttivi.reduce((acc, mezzo) => {
        const tipo = mezzo.tipoCarrozzeria;
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {}),
      
      conAutista: mezziAttivi.filter(m => m.autista && m.autista.trim() !== '').length,
      
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

module.exports = exports;