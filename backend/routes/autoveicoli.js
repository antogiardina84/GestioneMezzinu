// backend/routes/autoveicoli.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadFiles, handleMulterError } = require('../middleware/fileUpload');

// Importa TUTTE le funzioni dal controller
const {
  getAutoveicoli,
  getAutoveicolo,
  createAutoveicolo,
  updateAutoveicolo,
  deleteAutoveicolo,
  uploadAllegati,
  deleteAllegato,
  downloadAllegato,
  getScadenze,
  getScadenzePassZTL,
  updateStato,
  demolisciAutoveicolo,
  vendiAutoveicolo
} = require('../controllers/autoveicoli');

// Tutte le routes sono protette
router.use(protect);

// ============================================
// ROUTES PER SCADENZE (più specifiche - vanno prima)
// ============================================

router.get('/scadenze/all', getScadenze);
router.get('/scadenze/pass-ztl', getScadenzePassZTL);

// ============================================
// ROUTES BASE PER AUTOVEICOLI
// ============================================

router.get('/', getAutoveicoli);
router.post('/', createAutoveicolo);

// ============================================
// ROUTES PER ALLEGATI (specifiche - prima di /:id)
// ============================================

// Upload allegati
router.post('/:id/allegati', uploadFiles, handleMulterError, uploadAllegati);

// Download allegato
router.get('/:id/allegati/:allegatoId/download', downloadAllegato);

// Delete allegato
router.delete('/:id/allegati/:allegatoId', deleteAllegato);

// ============================================
// ROUTES PER GESTIONE STATO
// ============================================

router.put('/:id/stato', updateStato);
router.put('/:id/demolisci', demolisciAutoveicolo);
router.put('/:id/vendi', vendiAutoveicolo);

// ============================================
// ROUTES GENERICHE CON :id (vanno alla fine)
// ============================================

router.get('/:id', getAutoveicolo);
router.put('/:id', updateAutoveicolo);
router.delete('/:id', authorize('admin'), deleteAutoveicolo);

module.exports = router;