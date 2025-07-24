// backend/routes/alboGestori.js - VERSIONE AGGIORNATA per permettere operazioni agli utenti
const express = require('express');
const {
  getAlboGestori,
  getAlboGestore,
  createAlboGestore,
  updateAlboGestore,
  deleteAlboGestore,
  uploadAllegati,
  deleteAllegato,
  getScadenze
} = require('../controllers/alboGestori');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { uploadFiles, handleMulterError } = require('../middleware/fileUpload');

// Tutte le routes sono protette (richiedono login)
router.use(protect);

// ROUTES ACCESSIBILI A TUTTI GLI UTENTI AUTENTICATI
router
  .route('/')
  .get(getAlboGestori)                    //  Tutti possono leggere
  .post(createAlboGestore);               //  Tutti possono creare

router
  .route('/:id')
  .get(getAlboGestore)                    //  Tutti possono leggere
  .put(updateAlboGestore)                 //  Tutti possono aggiornare
  .delete(authorize('admin'), deleteAlboGestore); //  Solo admin possono eliminare

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

// Routes per le scadenze - ACCESSIBILI A TUTTI
router.get('/scadenze/all', getScadenze); //  Tutti possono vedere scadenze

module.exports = router;