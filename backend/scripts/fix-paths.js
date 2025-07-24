// backend/scripts/fix-paths.js
const mongoose = require('mongoose');
const Autoveicolo = require('../models/Autoveicolo');
const AlboGestori = require('../models/AlboGestori');
const REN = require('../models/REN');
require('dotenv').config();

const normalizePathForUrl = (filePath) => {
  if (!filePath) return '';

  console.error(`🔧 Input: "${filePath}"`);

  // Converti TUTTI i backslash in forward slash
  let normalized = filePath.replace(/\\/g, '/');
  console.error(`🔧 After backslash: "${normalized}"`);

  // Se non inizia con uploads/, aggiungilo
  if (!normalized.startsWith('uploads/')) {
    const uploadsIndex = normalized.indexOf('uploads');
    if (uploadsIndex >= 0) {
      normalized = normalized.substring(uploadsIndex);
    } else {
      normalized = `uploads/${normalized}`;
    }
  }

  // Doppio controllo per backslash rimasti
  normalized = normalized.replace(/\\/g, '/');

  // Rimuovi doppie slash
  normalized = normalized.replace(/\/\/+/g, '/');

  console.error(`✅ Output: "${normalized}"`);
  return normalized;
};

async function fixAllPaths() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.error('✅ MongoDB connesso');

    let totalFixed = 0;

    // Fix autoveicoli
    console.error('\n🚗 Fixing autoveicoli...');
    const autoveicoli = await Autoveicolo.find({});
    for (const auto of autoveicoli) {
      let updated = false;
      for (const allegato of auto.allegati) {
        const newPath = normalizePathForUrl(allegato.percorsoFile);
        if (newPath !== allegato.percorsoFile) {
          console.error(
            `  📄 ${auto.targa}: "${allegato.percorsoFile}" -> "${newPath}"`
          );
          allegato.percorsoFile = newPath;
          updated = true;
          totalFixed++;
        }
      }
      if (updated) {
        await auto.save();
      }
    }

    // Fix albo gestori
    console.error('\n📋 Fixing albo gestori...');
    const alboGestori = await AlboGestori.find({});
    for (const albo of alboGestori) {
      let updated = false;
      for (const allegato of albo.allegati) {
        const newPath = normalizePathForUrl(allegato.percorsoFile);
        if (newPath !== allegato.percorsoFile) {
          console.error(
            `  📄 ${albo.numeroIscrizioneAlbo}: "${allegato.percorsoFile}" -> "${newPath}"`
          );
          allegato.percorsoFile = newPath;
          updated = true;
          totalFixed++;
        }
      }
      if (updated) {
        await albo.save();
      }
    }

    // Fix REN
    console.error('\n📜 Fixing REN...');
    const rens = await REN.find({});
    for (const ren of rens) {
      let updated = false;
      for (const allegato of ren.allegati) {
        const newPath = normalizePathForUrl(allegato.percorsoFile);
        if (newPath !== allegato.percorsoFile) {
          console.error(
            `  📄 ${ren.numeroIscrizioneREN}: "${allegato.percorsoFile}" -> "${newPath}"`
          );
          allegato.percorsoFile = newPath;
          updated = true;
          totalFixed++;
        }
      }
      if (updated) {
        await ren.save();
      }
    }

    console.error(
      `\n✅ Migrazione completata! ${totalFixed} percorsi corretti.`
    );
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore migrazione:', error);
    process.exit(1);
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  fixAllPaths();
}

module.exports = fixAllPaths;
