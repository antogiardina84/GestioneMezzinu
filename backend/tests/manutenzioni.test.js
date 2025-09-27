const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Manutenzione = require('../models/Manutenzione');
const Autoveicolo = require('../models/Autoveicolo');

describe('Manutenzioni API', () => {
  let authToken;
  let testAutoveicolo;
  let testManutenzione;

  beforeAll(async () => {
    // Setup test database connection
    await mongoose.connect(process.env.TEST_MONGODB_URI);
    
    // Login per ottenere token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginRes.body.token;

    // Crea autoveicolo di test
    testAutoveicolo = await Autoveicolo.create({
      marca: 'Test',
      modello: 'Test',
      targa: 'TEST123',
      tipoCarrozzeria: 'Van',
      tipologiaAcquisto: 'Proprietà',
      dataImmatricolazione: new Date(),
      dataScadenzaBollo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      compagniaAssicurazione: 'Test Insurance',
      numeroPolizzaAssicurazione: 'TEST123',
      dataInizioAssicurazione: new Date(),
      dataScadenzaAssicurazione: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
  });

  afterAll(async () => {
    await Manutenzione.deleteMany({});
    await Autoveicolo.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/manutenzioni', () => {
    test('Dovrebbe creare una nuova manutenzione', async () => {
      const manutenzioneData = {
        autoveicolo: testAutoveicolo._id,
        tipoManutenzione: 'Tagliando',
        descrizione: 'Test tagliando',
        dataProgrammata: new Date(),
        stato: 'Programmata',
        priorita: 'Media',
        fornitore: {
          nome: 'Test Garage'
        },
        costi: {
          manodopera: 100,
          ricambi: 50,
          altri: 10,
          iva: 22
        }
      };

      const res = await request(app)
        .post('/api/manutenzioni')
        .set('Authorization', `Bearer ${authToken}`)
        .send(manutenzioneData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.descrizione).toBe(manutenzioneData.descrizione);
      
      testManutenzione = res.body.data;
    });

    test('Dovrebbe restituire errore senza autoveicolo', async () => {
      const res = await request(app)
        .post('/api/manutenzioni')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          descrizione: 'Test senza autoveicolo'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/manutenzioni', () => {
    test('Dovrebbe recuperare lista manutenzioni', async () => {
      const res = await request(app)
        .get('/api/manutenzioni')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('Dovrebbe filtrare per autoveicolo', async () => {
      const res = await request(app)
        .get(`/api/manutenzioni?autoveicolo=${testAutoveicolo._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/manutenzioni/:id', () => {
    test('Dovrebbe recuperare singola manutenzione', async () => {
      const res = await request(app)
        .get(`/api/manutenzioni/${testManutenzione._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(testManutenzione._id);
    });
  });

  describe('PUT /api/manutenzioni/:id', () => {
    test('Dovrebbe aggiornare manutenzione', async () => {
      const updateData = {
        stato: 'Completata',
        dataEsecuzione: new Date()
      };

      const res = await request(app)
        .put(`/api/manutenzioni/${testManutenzione._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.stato).toBe('Completata');
    });
  });

  describe('GET /api/manutenzioni/scadenze', () => {
    test('Dovrebbe recuperare scadenze', async () => {
      const res = await request(app)
        .get('/api/manutenzioni/scadenze')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scaduteEUrgenti');
      expect(res.body.data).toHaveProperty('prossimeScadenze');
    });
  });

  describe('DELETE /api/manutenzioni/:id', () => {
    test('Dovrebbe eliminare manutenzione', async () => {
      const res = await request(app)
        .delete(`/api/manutenzioni/${testManutenzione._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});