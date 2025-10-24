// backend/routes/servizi.js
const express = require('express');
const {
  getServizi,
  getServizio,
  createServizio,
  updateServizio,
  deleteServizio,
  uploadAllegati,
  deleteAllegato,
  getServiziCalendario,
  getStatistiche,
  verificaConflitti,
  generaServiziRicorrenti
} = require('../controllers/servizi');

const router = express.Router();
const { protect } = require('../middleware/auth');

// Tutte le routes sono protette
router.use(protect);

// Routes principali
router.route('/')
  .get(getServizi)
  .post(createServizio);

// Routes speciali (prima delle routes con :id per evitare conflitti)
router.get('/calendario/:tipo', getServiziCalendario);
router.get('/statistiche', getStatistiche);
router.post('/verifica-conflitti', verificaConflitti);

// Routes per singolo servizio
router.route('/:id')
  .get(getServizio)
  .put(updateServizio)
  .delete(deleteServizio);

// Routes per allegati
router.post('/:id/allegati', uploadAllegati);
router.delete('/:id/allegati/:allegatoId', deleteAllegato);

// Route per generare servizi ricorrenti
router.post('/:id/genera-ricorrenti', generaServiziRicorrenti);

module.exports = router;