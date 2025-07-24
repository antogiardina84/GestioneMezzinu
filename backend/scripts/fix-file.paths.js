const mongoose = require('mongoose');
const Autoveicolo = require('../models/Autoveicolo');
const AlboGestori = require('../models/AlboGestori');
const REN = require('../models/REN');
require('dotenv').config();

const normalizePathForUrl = (filePath) => {
  if (!filePath) return '';
  let normalized = filePath.replace(/\\/g, '/');
  if (!normalized.startsWith('uploads/')) {
    const uploadsIndex = normalized.indexOf('uploads');
    if (uploadsIndex >= 0) {
      normalized = normalized.substring(uploadsIndex);
    } else {
      normalized = `uploads/${normalized}`;
    }
  }
  return normalized;
};

async function fixFilePaths() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.error('MongoDB connesso');

    // Fix autoveicoli
    const autoveicoli = await Autoveicolo.find({});
    for (const auto of autoveicoli) {
      let updated = false;
      for (const allegato of auto.allegati) {
        const newPath = normalizePathForUrl(allegato.percorsoFile);
        if (newPath !== allegato.percorsoFile) {
          console.error(
            `Updating path: ${allegato.percorsoFile} -> ${newPath}`
          );
          allegato.percorsoFile = newPath;
          updated = true;
        }
      }
      if (updated) {
        await auto.save();
        console.error(`Updated autoveicolo: ${auto.targa}`);
      }
    }

    // Fix albo gestori
    const alboGestori = await AlboGestori.find({});
    for (const albo of alboGestori) {
      let updated = false;
      for (const allegato of albo.allegati) {
        const newPath = normalizePathForUrl(allegato.percorsoFile);
        if (newPath !== allegato.percorsoFile) {
          console.error(
            `Updating path: ${allegato.percorsoFile} -> ${newPath}`
          );
          allegato.percorsoFile = newPath;
          updated = true;
        }
      }
      if (updated) {
        await albo.save();
        console.error(`Updated albo gestori: ${albo.numeroIscrizioneAlbo}`);
      }
    }

    // Fix REN
    const rens = await REN.find({});
    for (const ren of rens) {
      let updated = false;
      for (const allegato of ren.allegati) {
        const newPath = normalizePathForUrl(allegato.percorsoFile);
        if (newPath !== allegato.percorsoFile) {
          console.error(
            `Updating path: ${allegato.percorsoFile} -> ${newPath}`
          );
          allegato.percorsoFile = newPath;
          updated = true;
        }
      }
      if (updated) {
        await ren.save();
        console.error(`Updated REN: ${ren.numeroIscrizioneREN}`);
      }
    }

    console.error('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  fixFilePaths();
}

module.exports = fixFilePaths;
