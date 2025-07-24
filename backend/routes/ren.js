// backend/routes/ren.js - VERSIONE AGGIORNATA per permettere operazioni agli utenti
const express = require('express');
const {
  getRENs,
  getREN,
  createREN,
  updateREN,
  deleteREN,
  uploadAllegati,
  deleteAllegato,
  getScadenze,
  getProvince
} = require('../controllers/ren');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { uploadFiles, handleMulterError } = require('../middleware/fileUpload');

// Tutte le routes sono protette (richiedono login)
router.use(protect);

// ROUTES ACCESSIBILI A TUTTI GLI UTENTI AUTENTICATI
router
  .route('/')
  .get(getRENs)                           //  Tutti possono leggere
  .post(createREN);                       //  Tutti possono creare

router
  .route('/:id')
  .get(getREN)                            //  Tutti possono leggere
  .put(updateREN)                         //  Tutti possono aggiornare
  .delete(authorize('admin'), deleteREN); // Solo admin possono eliminare

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

// Route per ottenere le province di una regione - ACCESSIBILE A TUTTI
router.get('/province/:regione', getProvince); //  Tutti possono vedere province

module.exports = router;