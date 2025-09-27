const mongoose = require('mongoose');
const Manutenzione = require('../models/Manutenzione');
const Autoveicolo = require('../models/Autoveicolo');
require('dotenv').config();

const seedManutenzioni = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database');

    // Ottieni alcuni autoveicoli esistenti
    const autoveicoli = await Autoveicolo.find({ stato: 'Attivo' }).limit(5);
    
    if (autoveicoli.length === 0) {
      console.log('❌ Nessun autoveicolo attivo trovato');
      process.exit(1);
    }

    // Elimina manutenzioni esistenti (solo per testing)
    await Manutenzione.deleteMany({});
    console.log('🗑️  Manutenzioni esistenti eliminate');

    const manutenzioniSeed = [
      {
        autoveicolo: autoveicoli[0]._id,
        tipoManutenzione: 'Tagliando',
        descrizione: 'Tagliando periodico 15.000 km - cambio olio e filtri',
        dataProgrammata: new Date('2024-12-01'),
        dataEsecuzione: new Date('2024-12-01'),
        stato: 'Completata',
        priorita: 'Media',
        chilometraggioProgammato: 15000,
        chilometraggioEsecuzione: 15120,
        fornitore: {
          nome: 'Autofficina Rossi',
          telefono: '0123456789',
          email: 'info@officinarossi.it',
          partitaIVA: '12345678901'
        },
        costi: {
          manodopera: 80,
          ricambi: 45,
          altri: 10,
          iva: 22
        },
        ricambi: [
          { descrizione: 'Olio motore 5W30', quantita: 4, prezzoUnitario: 8 },
          { descrizione: 'Filtro olio', quantita: 1, prezzoUnitario: 12 },
          { descrizione: 'Filtro aria', quantita: 1, prezzoUnitario: 15 }
        ]
      },
      {
        autoveicolo: autoveicoli[1]._id,
        tipoManutenzione: 'Riparazione',
        descrizione: 'Sostituzione pastiglie freno anteriori',
        dataProgrammata: new Date('2024-12-15'),
        stato: 'Programmata',
        priorita: 'Alta',
        chilometraggioProgammato: 45000,
        fornitore: {
          nome: 'Centro Assistenza Bianchi',
          telefono: '0987654321',
          email: 'assistenza@bianchi.it'
        },
        costi: {
          manodopera: 60,
          ricambi: 85,
          altri: 5,
          iva: 22
        },
        ricambi: [
          { descrizione: 'Kit pastiglie freno anteriori', quantita: 1, prezzoUnitario: 85 }
        ]
      },
      {
        autoveicolo: autoveicoli[2]._id,
        tipoManutenzione: 'Preventiva',
        descrizione: 'Controllo generale pre-inverno',
        dataProgrammata: new Date('2024-11-20'),
        dataEsecuzione: new Date('2024-11-22'),
        stato: 'Completata',
        priorita: 'Bassa',
        fornitore: {
          nome: 'Garage Verdi',
          telefono: '0112233445'
        },
        costi: {
          manodopera: 40,
          ricambi: 15,
          altri: 0,
          iva: 22
        },
        note: 'Controllo batteria, luci, pneumatici e liquidi'
      },
      {
        autoveicolo: autoveicoli[0]._id,
        tipoManutenzione: 'Straordinaria',
        descrizione: 'Riparazione sistema di scarico',
        dataProgrammata: new Date('2024-12-10'),
        stato: 'In corso',
        priorita: 'Urgente',
        fornitore: {
          nome: 'Autofficina Rossi',
          telefono: '0123456789',
          email: 'info@officinarossi.it'
        },
        note: 'Marmitta danneggiata, necessaria sostituzione completa'
      },
      {
        autoveicolo: autoveicoli[3]._id,
        tipoManutenzione: 'Revisione',
        descrizione: 'Preparazione per revisione ministeriale',
        dataProgrammata: new Date('2025-01-15'),
        stato: 'Programmata',
        priorita: 'Media',
        fornitore: {
          nome: 'Centro Revisioni AutoCheck',
          telefono: '0334455667'
        },
        prossimaScadenza: {
          data: new Date('2027-01-15'),
          descrizione: 'Prossima revisione ministeriale'
        }
      }
    ];

    await Manutenzione.insertMany(manutenzioniSeed);
    console.log(`✅ Create ${manutenzioniSeed.length} manutenzioni di esempio`);
    
    console.log('🎉 Seed manutenzioni completato!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Errore durante il seed:', error);
    process.exit(1);
  }
};

seedManutenzioni();