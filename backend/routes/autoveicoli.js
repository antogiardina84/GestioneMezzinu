// backend/routes/autoveicoli.js - VERSIONE AGGIORNATA per permettere operazioni agli utenti
const express = require('express');
const {
  getAutoveicoli,
  getAutoveicolo,
  createAutoveicolo,
  updateAutoveicolo,
  deleteAutoveicolo,
  uploadAllegati,
  deleteAllegato,
  getScadenze,
  updateStato,
  demolisciAutoveicolo,
  vendiAutoveicolo
} = require('../controllers/autoveicoli');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { uploadFiles, handleMulterError } = require('../middleware/fileUpload');

// Tutte le routes sono protette (richiedono login)
router.use(protect);

// ROUTES ACCESSIBILI A TUTTI GLI UTENTI AUTENTICATI
router
  .route('/')
  .get(getAutoveicoli)                    //  Tutti possono leggere
  .post(createAutoveicolo);               //  Tutti possono creare

router
  .route('/:id')
  .get(getAutoveicolo)                    //  Tutti possono leggere
  .put(updateAutoveicolo)                 //  Tutti possono aggiornare
  .delete(authorize('admin'), deleteAutoveicolo); //  Solo admin possono eliminare

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

// ROUTES RISERVATE AGLI ADMIN (operazioni critiche)
router.put('/:id/stato', authorize('admin'), updateStato);
router.put('/:id/demolisci', authorize('admin'), demolisciAutoveicolo);
router.put('/:id/vendi', authorize('admin'), vendiAutoveicolo);

module.exports = router;