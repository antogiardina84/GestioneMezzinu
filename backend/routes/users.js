// backend/routes/users.js
const express = require('express');

// Prima verifichiamo che tutte le funzioni siano disponibili
let usersController;
try {
  usersController = require('../controllers/users');
  console.log('✅ Controller users caricato con successo');
  console.log('📋 Funzioni disponibili:', Object.keys(usersController));
} catch (error) {
  console.error('❌ Errore nel caricamento controller users:', error.message);
  process.exit(1);
}

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  toggleUserStatus,
  getUsersStatistics
} = usersController;

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Verifica che tutte le funzioni siano definite
const requiredFunctions = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  toggleUserStatus,
  getUsersStatistics
};

console.log('🔍 Verifica funzioni controller:');
Object.entries(requiredFunctions).forEach(([name, func]) => {
  if (typeof func !== 'function') {
    console.error(`❌ ${name} non è una funzione:`, typeof func);
  } else {
    console.log(`✅ ${name}: OK`);
  }
});

// Tutte le routes sono protette e riservate agli admin
router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(getUsers)
  .post(createUser);

router
  .route('/statistics')
  .get(getUsersStatistics);

router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router
  .route('/:id/password')
  .put(updateUserPassword);

router
  .route('/:id/toggle-status')
  .put(toggleUserStatus);

module.exports = router;