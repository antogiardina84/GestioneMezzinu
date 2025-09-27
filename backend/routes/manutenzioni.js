// backend/routes/manutenzioni.js - VERSIONE COMPLETA E CORRETTA
const express = require('express');
const {
  getManutenzioni,
  getManutenzione,
  createManutenzione,
  updateManutenzione,
  deleteManutenzione,
  uploadAllegati,
  deleteAllegato,
  getScadenze,
  getStatistiche  // <-- AGGIUNTO
} = require('../controllers/manutenzioni');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { uploadFiles, handleMulterError } = require('../middleware/fileUpload');

// Tutte le routes sono protette (richiedono login)
router.use(protect);

// IMPORTANTE: Le routes specifiche devono venire PRIMA delle routes parametriche /:id

// Routes per le scadenze - ACCESSIBILI A TUTTI (DEVE STARE PRIMA DI /:id)
router.get('/scadenze', getScadenze); //  Tutti possono vedere scadenze

// Routes per le statistiche - ACCESSIBILI A TUTTI (DEVE STARE PRIMA DI /:id)
router.get('/statistiche', getStatistiche); //  Tutti possono vedere statistiche

// ROUTES ACCESSIBILI A TUTTI GLI UTENTI AUTENTICATI
router
  .route('/')
  .get(getManutenzioni)                   //  Tutti possono leggere
  .post(createManutenzione);              //  Tutti possono creare

router
  .route('/:id')
  .get(getManutenzione)                   //  Tutti possono leggere
  .put(updateManutenzione)                //  Tutti possono aggiornare
  .delete(authorize('admin'), deleteManutenzione); //  Solo admin possono eliminare

// Routes per gli allegati - ACCESSIBILI A TUTTI
router.post(
  '/:id/allegati',
  uploadFiles,
  handleMulterError,
  uploadAllegati                          //  Tutti possono caricare allegati
);

router.delete(
  '/:id/allegati/:allegatoId',
  deleteAllegato                          //  Tutti possono eliminare allegati
);

module.exports = router;