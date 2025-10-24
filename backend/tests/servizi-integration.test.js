// backend/tests/servizi-integration.test.js
/**
 * Test di integrazione per il modulo Servizi
 * Esegui con: npm test servizi-integration.test.js
 * 
 * PREREQUISITI:
 * 1. Server backend avviato
 * 2. Database MongoDB connesso
 * 3. Almeno un autoveicolo nel database
 * 4. Token JWT valido
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Servizio = require('../models/Servizio');
const Autoveicolo = require('../models/Autoveicolo');
const User = require('../models/User');

describe('Servizi API Integration Tests', () => {
  let authToken;
  let testAutoveicolo;
  let testServizio;
  let testUserId;

  // Setup: Connessione DB e login
  beforeAll(async () => {
    // Connetti al database di test
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:28017/gestione_mezzi_domus_test');
    }

    // Crea o ottieni utente di test
    let testUser = await User.findOne({ email: 'test@servizi.com' });
    if (!testUser) {
      testUser = await User.create({
        nome: 'Test',
        cognome: 'Servizi',
        email: 'test@servizi.com',
        password: 'TestPassword123!',
        ruolo: 'admin'
      });
    }
    testUserId = testUser._id;

    // Login per ottenere token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@servizi.com',
        password: 'TestPassword123!'
      });

    authToken = loginResponse.body.token;
    expect(authToken).toBeDefined();

    // Crea o ottieni autoveicolo di test
    testAutoveicolo = await Autoveicolo.findOne({ targa: 'TEST123' });
    if (!testAutoveicolo) {
      testAutoveicolo = await Autoveicolo.create({
        marca: 'FIAT',
        modello: 'DUCATO TEST',
        cilindrata: 2300,
        kw: 110,
        targa: 'TEST123',
        tipoCarrozzeria: 'Van',
        tipologiaAcquisto: 'Proprietà',
        dataImmatricolazione: new Date('2020-01-01'),
        ultimaRevisione: new Date('2023-01-01'),
        dataScadenzaBollo: new Date('2025-12-31'),
        compagniaAssicurazione: 'Test Insurance',
        numeroPolizzaAssicurazione: 'TEST123456',
        dataInizioAssicurazione: new Date('2024-01-01'),
        dataScadenzaAssicurazione: new Date('2025-12-31'),
        autista: 'Mario Rossi Test'
      });
    }
  });

  // Cleanup: Elimina dati di test
  afterAll(async () => {
    // Elimina servizi di test
    await Servizio.deleteMany({ titolo: /TEST/ });
    
    // Chiudi connessione
    await mongoose.connection.close();
  });

  // Test 1: Creazione servizio
  describe('POST /api/servizi', () => {
    it('Dovrebbe creare un nuovo servizio', async () => {
      const nuovoServizio = {
        titolo: 'TEST - Trasporto materiale',
        descrizione: 'Servizio di test per trasporto materiale edile',
        autoveicolo: testAutoveicolo._id.toString(),
        autista: 'Mario Rossi Test',
        tipoServizio: 'Trasporto',
        dataInizio: new Date('2025-11-01T08:00:00.000Z'),
        dataFine: new Date('2025-11-01T17:00:00.000Z'),
        oraInizio: '08:00',
        oraFine: '17:00',
        priorita: 'Alta',
        stato: 'Programmato',
        luogoPartenza: {
          indirizzo: 'Via Roma 1',
          citta: 'Milano',
          provincia: 'MI',
          cap: '20100'
        },
        luogoArrivo: {
          indirizzo: 'Via Verdi 10',
          citta: 'Roma',
          provincia: 'RM',
          cap: '00100'
        },
        cliente: {
          nome: 'Cliente Test S.r.l.',
          telefono: '+39 02 1234567',
          email: 'cliente@test.com'
        },
        materiali: [
          {
            descrizione: 'Cemento',
            quantita: 100,
            unitaMisura: 'kg',
            peso: 100
          }
        ],
        costi: {
          pedaggi: 25.50,
          parcheggi: 5.00,
          altri: 10.00
        },
        note: 'Servizio di test'
      };

      const response = await request(app)
        .post('/api/servizi')
        .set('Authorization', `Bearer ${authToken}`)
        .send(nuovoServizio)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.titolo).toBe(nuovoServizio.titolo);
      expect(response.body.data.autista).toBe(nuovoServizio.autista);
      
      testServizio = response.body.data;
    });

    it('Dovrebbe rifiutare servizio senza titolo', async () => {
      const servizioInvalido = {
        autoveicolo: testAutoveicolo._id.toString(),
        dataInizio: new Date(),
        dataFine: new Date(),
        oraInizio: '08:00',
        oraFine: '17:00'
      };

      await request(app)
        .post('/api/servizi')
        .set('Authorization', `Bearer ${authToken}`)
        .send(servizioInvalido)
        .expect(400);
    });

    it('Dovrebbe rifiutare servizio con autoveicolo inesistente', async () => {
      const servizioInvalido = {
        titolo: 'TEST - Servizio invalido',
        autoveicolo: '507f1f77bcf86cd799439011', // ID fittizio
        autista: 'Test',
        dataInizio: new Date(),
        dataFine: new Date(),
        oraInizio: '08:00',
        oraFine: '17:00'
      };

      await request(app)
        .post('/api/servizi')
        .set('Authorization', `Bearer ${authToken}`)
        .send(servizioInvalido)
        .expect(404);
    });
  });

  // Test 2: Lettura servizi
  describe('GET /api/servizi', () => {
    it('Dovrebbe restituire lista servizi', async () => {
      const response = await request(app)
        .get('/api/servizi')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });

    it('Dovrebbe filtrare per autoveicolo', async () => {
      const response = await request(app)
        .get(`/api/servizi?autoveicolo=${testAutoveicolo._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(servizio => {
        expect(servizio.autoveicolo._id).toBe(testAutoveicolo._id.toString());
      });
    });

    it('Dovrebbe filtrare per stato', async () => {
      const response = await request(app)
        .get('/api/servizi?stato=Programmato')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(servizio => {
        expect(servizio.stato).toBe('Programmato');
      });
    });

    it('Dovrebbe supportare ricerca testuale', async () => {
      const response = await request(app)
        .get('/api/servizi?search=TEST')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('Dovrebbe supportare paginazione', async () => {
      const response = await request(app)
        .get('/api/servizi?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination).toBeDefined();
    });
  });

  // Test 3: Lettura singolo servizio
  describe('GET /api/servizi/:id', () => {
    it('Dovrebbe restituire dettaglio servizio', async () => {
      const response = await request(app)
        .get(`/api/servizi/${testServizio._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testServizio._id);
      expect(response.body.data.autoveicolo).toBeDefined();
      expect(response.body.data.autoveicolo.targa).toBe(testAutoveicolo.targa);
    });

    it('Dovrebbe restituire 404 per ID inesistente', async () => {
      await request(app)
        .get('/api/servizi/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  // Test 4: Aggiornamento servizio
  describe('PUT /api/servizi/:id', () => {
    it('Dovrebbe aggiornare un servizio', async () => {
      const aggiornamento = {
        stato: 'In corso',
        noteCompletamento: 'Servizio avviato',
        chilometraggio: {
          iniziale: 50000,
          finale: 50350,
          totale: 350
        }
      };

      const response = await request(app)
        .put(`/api/servizi/${testServizio._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(aggiornamento)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stato).toBe('In corso');
      expect(response.body.data.chilometraggio.totale).toBe(350);
    });

    it('Dovrebbe restituire 404 per ID inesistente', async () => {
      await request(app)
        .put('/api/servizi/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stato: 'Completato' })
        .expect(404);
    });
  });

  // Test 5: Calendario
  describe('GET /api/servizi/calendario/:tipo', () => {
    it('Dovrebbe restituire vista mensile', async () => {
      const response = await request(app)
        .get('/api/servizi/calendario/mese')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.periodo).toBeDefined();
      expect(response.body.periodo.tipo).toBe('mese');
      expect(response.body.data).toBeDefined();
    });

    it('Dovrebbe restituire vista settimanale', async () => {
      const response = await request(app)
        .get('/api/servizi/calendario/settimana')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.periodo.tipo).toBe('settimana');
    });

    it('Dovrebbe restituire vista giornaliera', async () => {
      const response = await request(app)
        .get('/api/servizi/calendario/giorno')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.periodo.tipo).toBe('giorno');
    });

    it('Dovrebbe accettare parametro data', async () => {
      const data = '2025-11-01';
      const response = await request(app)
        .get(`/api/servizi/calendario/mese?data=${data}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // Test 6: Statistiche
  describe('GET /api/servizi/statistiche', () => {
    it('Dovrebbe restituire statistiche anno corrente', async () => {
      const response = await request(app)
        .get('/api/servizi/statistiche')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contatori).toBeDefined();
      expect(response.body.data.statistichePerTipo).toBeDefined();
      expect(response.body.data.statistichePerAutoveicolo).toBeDefined();
      expect(response.body.data.statistichePerAutista).toBeDefined();
      expect(response.body.data.serviziMensili).toBeDefined();
    });

    it('Dovrebbe accettare parametro anno', async () => {
      const response = await request(app)
        .get('/api/servizi/statistiche?anno=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.anno).toBe(2025);
    });
  });

  // Test 7: Verifica conflitti
  describe('POST /api/servizi/verifica-conflitti', () => {
    it('Dovrebbe rilevare conflitti', async () => {
      const datiConflitto = {
        autoveicolo: testAutoveicolo._id.toString(),
        dataInizio: '2025-11-01T08:00:00.000Z',
        dataFine: '2025-11-01T17:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/servizi/verifica-conflitti')
        .set('Authorization', `Bearer ${authToken}`)
        .send(datiConflitto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.conflitti).toBeDefined();
      // Dovrebbe trovare il servizio di test creato prima
      if (response.body.count > 0) {
        expect(response.body.data[0].autoveicolo._id).toBe(testAutoveicolo._id.toString());
      }
    });

    it('Non dovrebbe rilevare conflitti in periodi diversi', async () => {
      const datiNonConflitto = {
        autoveicolo: testAutoveicolo._id.toString(),
        dataInizio: '2025-12-01T08:00:00.000Z',
        dataFine: '2025-12-01T17:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/servizi/verifica-conflitti')
        .set('Authorization', `Bearer ${authToken}`)
        .send(datiNonConflitto)
        .expect(200);

      expect(response.body.conflitti).toBe(false);
    });
  });

  // Test 8: Eliminazione servizio
  describe('DELETE /api/servizi/:id', () => {
    it('Dovrebbe eliminare un servizio', async () => {
      const response = await request(app)
        .delete(`/api/servizi/${testServizio._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verifica che sia stato eliminato
      await request(app)
        .get(`/api/servizi/${testServizio._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('Dovrebbe restituire 404 per ID inesistente', async () => {
      await request(app)
        .delete('/api/servizi/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  // Test 9: Autorizzazione
  describe('Authorization Tests', () => {
    it('Dovrebbe rifiutare richieste senza token', async () => {
      await request(app)
        .get('/api/servizi')
        .expect(401);
    });

    it('Dovrebbe rifiutare richieste con token invalido', async () => {
      await request(app)
        .get('/api/servizi')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);
    });
  });
});

// Helper per eseguire singoli test
if (require.main === module) {
  console.log('🧪 Esecuzione test servizi...\n');
  
  // Configurazione Jest programmatica
  const jest = require('jest');
  jest.run(['servizi-integration.test.js']);
}