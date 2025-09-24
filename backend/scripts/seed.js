const mongoose = require('mongoose');
const User = require('../models/User');
const Autoveicolo = require('../models/Autoveicolo');
const AlboGestori = require('../models/AlboGestori');
const REN = require('../models/REN');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connessione al database
    await mongoose.connect(process.env.MONGODB_URI);
    // eslint-disable-next-line no-console
    console.log('MongoDB connesso');

    // Cancella tutti i dati esistenti
    await User.deleteMany();
    await Autoveicolo.deleteMany();
    await AlboGestori.deleteMany();
    await REN.deleteMany();

    const adminUser = await User.create([
      {
        nome: 'Admin',
        cognome: 'Admin',
        email: 'admin@gestionemezzi.com',
        password: 'Admin!123',
        ruolo: 'admin'
      }      
    ]);
    const alboGestori = await AlboGestori.insertMany([
      {
        numeroIscrizioneAlbo: 'AG001',
        categoria: '4',
        classe: 'B',
        dataIscrizione: new Date('2020-01-01'),
        dataScadenzaIscrizione: new Date('2025-01-01')
      },
      {
        numeroIscrizioneAlbo: 'AG002',
        categoria: '5',
        classe: 'C',
        dataIscrizione: new Date('2021-05-15'),
        dataScadenzaIscrizione: new Date('2026-05-15')
      }
    ]);

    const ren = await REN.insertMany([
      {
        numeroIscrizioneREN: 'REN001',
        dataIscrizioneREN: new Date('2020-01-01'),
        dataScadenzaREN: new Date('2025-01-01'),
        regione: 'Sicilia',
        provincia: 'Catania',
        tipologiaAttività: 'Conto Terzi',
        numeroIscrizioneContoTerzi: 'CT001'
      },
      {
        numeroIscrizioneREN: 'REN002',
        dataIscrizioneREN: new Date('2021-06-01'),
        dataScadenzaREN: new Date('2026-06-01'),
        regione: 'Sicilia',
        provincia: 'Palermo',
        tipologiaAttività: 'Conto Proprio'
      }
    ]);

    const autoveicoli = await Autoveicolo.insertMany([
      {
        marca: 'FIAT',
        modello: 'DUCATO',
        cilindrata: 2300,
        kw: 110,
        targa: 'AA123BB',
        tipoCarrozzeria: 'Cassonato',
        tipologiaAcquisto: 'Proprietà',
        dataImmatricolazione: new Date('2020-03-15'),
        ultimaRevisione: new Date('2022-03-15'),
        dataScadenzaBollo: new Date('2025-03-31'),
        compagniaAssicurazione: 'ASSITALIA',
        numeroPolizzaAssicurazione: 'POL123456',
        dataInizioAssicurazione: new Date('2024-01-01'),
        dataScadenzaAssicurazione: new Date('2025-01-01'),
        iscrizioneANGA: [alboGestori[0]._id]
      },
      {
        marca: 'IVECO',
        modello: 'DAILY',
        cilindrata: 3000,
        kw: 150,
        targa: 'CC456DD',
        tipoCarrozzeria: 'Van',
        tipologiaAcquisto: 'Leasing',
        scadenzaTitoloProprietà: new Date('2025-12-31'),
        dataImmatricolazione: new Date('2021-06-01'),
        dataScadenzaBollo: new Date('2025-06-30'),
        compagniaAssicurazione: 'ALLIANZ',
        numeroPolizzaAssicurazione: 'POL789012',
        dataInizioAssicurazione: new Date('2024-06-01'),
        dataScadenzaAssicurazione: new Date('2025-06-01'),
        iscrizioneANGA: [alboGestori[0]._id, alboGestori[1]._id]
      },
      {
        marca: 'MERCEDES',
        modello: 'SPRINTER',
        cilindrata: 2200,
        kw: 129,
        targa: 'EE789FF',
        tipoCarrozzeria: 'Van',
        tipologiaAcquisto: 'Noleggio',
        scadenzaTitoloProprietà: new Date('2026-03-31'),
        dataImmatricolazione: new Date('2022-03-01'),
        dataScadenzaBollo: new Date('2025-03-31'),
        compagniaAssicurazione: 'GENERALI',
        numeroPolizzaAssicurazione: 'POL345678',
        dataInizioAssicurazione: new Date('2024-03-01'),
        dataScadenzaAssicurazione: new Date('2025-03-01'),
        iscrizioneANGA: [alboGestori[1]._id]
      }
    ]);

    // eslint-disable-next-line no-console
    console.log('Dati di esempio inseriti con successo!');
    // eslint-disable-next-line no-console
    console.log(`Creato utente admin: ${adminUser.email} / admin123456`);
    // eslint-disable-next-line no-console
    console.log(`Inseriti ${autoveicoli.length} autoveicoli`);
    // eslint-disable-next-line no-console
    console.log(`Inserite ${alboGestori.length} iscrizioni Albo Gestori`);
    // eslint-disable-next-line no-console
    console.log(`Inserite ${ren.length} iscrizioni REN`);

    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Errore durante il seeding:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
