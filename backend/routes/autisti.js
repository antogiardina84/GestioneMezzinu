// backend/routes/autisti.js
const express = require('express');
const {
  getAutisti,
  getAutista,
  createAutista,
  updateAutista,
  deleteAutista,
  getAutistiDisponibili,
  getListaSemplice,
  verificaScadenzePatenti,
  verificaScadenzeQualifiche,
  uploadAllegato,
  deleteAllegato,
  getStatistiche
} = require('../controllers/autisti');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Tutte le routes sono protette
router.use(protect);

// Routes speciali (prima delle routes con :id)
router.get('/lista-semplice', getListaSemplice);
router.get('/disponibili', getAutistiDisponibili);
router.get('/scadenze/patenti', verificaScadenzePatenti);
router.get('/scadenze/qualifiche', verificaScadenzeQualifiche);
router.get('/stats', getStatistiche);

// Routes principali
router.route('/')
  .get(getAutisti)
  .post(createAutista);

// Routes per singolo autista
router.route('/:id')
  .get(getAutista)
  .put(updateAutista)
  .delete(authorize('admin'), deleteAutista);

// Routes per allegati
router.post('/:id/allegati', uploadAllegato);
router.delete('/:id/allegati/:allegatoId', deleteAllegato);

module.exports = router;