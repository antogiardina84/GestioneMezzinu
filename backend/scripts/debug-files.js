// scripts/debug-files.js - Script per debug dei file
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importa i modelli
const Autoveicolo = require('../models/Autoveicolo');
const AlboGestori = require('../models/AlboGestori');
const REN = require('../models/REN');

const debugFiles = async () => {
  try {
    console.log('🔍 Avvio debug file allegati...');

    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database');

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    console.log(`📁 Directory uploads: ${uploadsDir}`);

    // Verifica directory uploads
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Directory uploads non esiste!');
      return;
    }

    // Statistiche directory
    const stats = fs.statSync(uploadsDir);
    console.log(`📊 Directory uploads creata: ${stats.birthtime}`);

    // Lista subdirectory
    const subdirs = fs
      .readdirSync(uploadsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    console.log(`📂 Subdirectory trovate: ${subdirs.join(', ')}`);

    // Funzione per verificare allegati di un modello
    const checkModelFiles = async (Model, entityType, entityName) => {
      console.log(`\n🔍 Checking ${entityName}...`);

      const entities = await Model.find({});
      console.log(`📋 Trovate ${entities.length} entità ${entityName}`);

      let totalFiles = 0;
      let validFiles = 0;
      let invalidFiles = 0;

      for (const entity of entities) {
        if (entity.allegati && entity.allegati.length > 0) {
          console.log(`\n📄 ${entityName} ID: ${entity._id}`);
          if (entity.targa) console.log(`   Targa: ${entity.targa}`);
          if (entity.numeroIscrizioneAlbo)
            console.log(`   Numero Albo: ${entity.numeroIscrizioneAlbo}`);
          if (entity.numeroIscrizioneREN)
            console.log(`   Numero REN: ${entity.numeroIscrizioneREN}`);

          for (const allegato of entity.allegati) {
            totalFiles++;
            console.log(`   📎 File: ${allegato.nomeFile}`);
            console.log(`      Percorso DB: ${allegato.percorsoFile}`);

            // Normalizza il percorso
            let normalizedPath = allegato.percorsoFile.replace(/\\/g, '/');
            if (!normalizedPath.startsWith('uploads/')) {
              const uploadsIndex = normalizedPath.indexOf('uploads');
              if (uploadsIndex >= 0) {
                normalizedPath = normalizedPath.substring(uploadsIndex);
              } else {
                normalizedPath = `uploads/${normalizedPath}`;
              }
            }

            const fullPath = path.join(__dirname, '..', normalizedPath);
            console.log(`      Percorso normalizzato: ${normalizedPath}`);
            console.log(`      Percorso completo: ${fullPath}`);

            // Verifica esistenza
            if (fs.existsSync(fullPath)) {
              const fileStats = fs.statSync(fullPath);
              if (fileStats.isFile()) {
                validFiles++;
                console.log(
                  `      ✅ File esistente (${fileStats.size} bytes)`
                );
              } else {
                invalidFiles++;
                console.log(`      ❌ Non è un file (è una directory?)`);
              }
            } else {
              invalidFiles++;
              console.log(`      ❌ File non trovato`);

              // Prova a cercare in percorsi alternativi
              const fileName = path.basename(allegato.nomeFile);
              const searchPaths = [
                path.join(uploadsDir, fileName),
                path.join(uploadsDir, entityType, fileName),
                path.join(
                  uploadsDir,
                  entityType,
                  entity._id.toString(),
                  fileName
                )
              ];

              let found = false;
              for (const searchPath of searchPaths) {
                if (
                  fs.existsSync(searchPath) &&
                  fs.statSync(searchPath).isFile()
                ) {
                  console.log(`      🔀 Trovato in: ${searchPath}`);
                  found = true;
                  break;
                }
              }

              if (!found) {
                console.log(`      💀 File completamente perso: ${fileName}`);
              }
            }
          }
        }
      }

      console.log(`\n📊 Riepilogo ${entityName}:`);
      console.log(`   File totali: ${totalFiles}`);
      console.log(`   File validi: ${validFiles}`);
      console.log(`   File invalidi: ${invalidFiles}`);

      return { totalFiles, validFiles, invalidFiles };
    };

    // Controlla tutti i modelli
    const autoResults = await checkModelFiles(
      Autoveicolo,
      'autoveicoli',
      'Autoveicoli'
    );
    const alboResults = await checkModelFiles(
      AlboGestori,
      'albo-gestori',
      'Albo Gestori'
    );
    const renResults = await checkModelFiles(REN, 'ren', 'REN');

    // Riepilogo generale
    const totalFiles =
      autoResults.totalFiles + alboResults.totalFiles + renResults.totalFiles;
    const totalValid =
      autoResults.validFiles + alboResults.validFiles + renResults.validFiles;
    const totalInvalid =
      autoResults.invalidFiles +
      alboResults.invalidFiles +
      renResults.invalidFiles;

    console.log(`\n🎯 RIEPILOGO GENERALE:`);
    console.log(`   File totali nel database: ${totalFiles}`);
    console.log(`   File validi sul filesystem: ${totalValid}`);
    console.log(`   File mancanti/invalidi: ${totalInvalid}`);
    console.log(
      `   Percentuale successo: ${totalFiles > 0 ? ((totalValid / totalFiles) * 100).toFixed(1) : 0}%`
    );

    // Controlla file orfani (file sul filesystem non referenziati nel DB)
    console.log(`\n🔍 Controllo file orfani...`);

    // Raccogli tutti gli allegati dal database
    const allEntities = {
      autoveicoli: await Autoveicolo.find({}),
      alboGestori: await AlboGestori.find({}),
      ren: await REN.find({})
    };

    const allDbFiles = [
      ...allEntities.autoveicoli.flatMap((e) => e.allegati || []),
      ...allEntities.alboGestori.flatMap((e) => e.allegati || []),
      ...allEntities.ren.flatMap((e) => e.allegati || [])
    ].map((allegato) => {
      // Normalizza il percorso per il confronto
      let normalizedPath = allegato.percorsoFile.replace(/\\/g, '/');
      if (!normalizedPath.startsWith('uploads/')) {
        const uploadsIndex = normalizedPath.indexOf('uploads');
        if (uploadsIndex >= 0) {
          normalizedPath = normalizedPath.substring(uploadsIndex);
        } else {
          normalizedPath = `uploads/${normalizedPath}`;
        }
      }
      return {
        originalPath: allegato.percorsoFile,
        normalizedPath,
        fileName: allegato.nomeFile
      };
    });

    const findOrphanFiles = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);
      let orphans = [];

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item).replace(/\\/g, '/');
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          orphans = orphans.concat(findOrphanFiles(fullPath, relativePath));
        } else if (stat.isFile()) {
          // Verifica se questo file è referenziato nel database
          const fullRelativePath = `uploads/${relativePath}`;
          const isReferenced = allDbFiles.some(
            (dbFile) =>
              dbFile.normalizedPath === fullRelativePath ||
              dbFile.fileName === item ||
              dbFile.originalPath.includes(item)
          );

          if (!isReferenced) {
            orphans.push({
              path: fullPath,
              relativePath: fullRelativePath,
              fileName: item,
              size: stat.size,
              modified: stat.mtime
            });
          }
        }
      }

      return orphans;
    };

    const orphanFiles = findOrphanFiles(uploadsDir);

    if (orphanFiles.length > 0) {
      console.log(`\n💀 File orfani trovati (${orphanFiles.length}):`);
      let totalOrphanSize = 0;

      for (const orphan of orphanFiles) {
        console.log(`   📄 ${orphan.fileName}`);
        console.log(`      Percorso: ${orphan.relativePath}`);
        console.log(`      Dimensione: ${orphan.size} bytes`);
        console.log(`      Modificato: ${orphan.modified}`);
        totalOrphanSize += orphan.size;
      }

      console.log(
        `\n📊 Spazio occupato da file orfani: ${(totalOrphanSize / 1024 / 1024).toFixed(2)} MB`
      );

      // Chiedi se eliminare i file orfani
      console.log(
        `\n❓ Vuoi eliminare i file orfani? (Questo script è solo per analisi)`
      );
      console.log(
        `   Per eliminarli, aggiungi il parametro --cleanup quando esegui lo script`
      );

      if (process.argv.includes('--cleanup')) {
        console.log(`\n🗑️ Eliminazione file orfani...`);
        let deletedCount = 0;
        let deletedSize = 0;

        for (const orphan of orphanFiles) {
          try {
            fs.unlinkSync(orphan.path);
            console.log(`   ✅ Eliminato: ${orphan.fileName}`);
            deletedCount++;
            deletedSize += orphan.size;
          } catch (error) {
            console.log(
              `   ❌ Errore eliminazione ${orphan.fileName}: ${error.message}`
            );
          }
        }

        console.log(`\n🎯 Eliminazione completata:`);
        console.log(`   File eliminati: ${deletedCount}/${orphanFiles.length}`);
        console.log(
          `   Spazio liberato: ${(deletedSize / 1024 / 1024).toFixed(2)} MB`
        );
      }
    } else {
      console.log(`\n✅ Nessun file orfano trovato!`);
    }

    // Genera report finale
    console.log(`\n📋 REPORT FINALE:`);
    console.log(`   Directory uploads: ${uploadsDir}`);
    console.log(`   Subdirectory: ${subdirs.length}`);
    console.log(`   File nel database: ${totalFiles}`);
    console.log(
      `   File validi: ${totalValid} (${totalFiles > 0 ? ((totalValid / totalFiles) * 100).toFixed(1) : 0}%)`
    );
    console.log(`   File mancanti: ${totalInvalid}`);
    console.log(`   File orfani: ${orphanFiles.length}`);

    // Suggerimenti
    if (totalInvalid > 0) {
      console.log(`\n💡 SUGGERIMENTI:`);
      console.log(
        `   1. Esegui lo script fix-file-paths.js per correggere i percorsi`
      );
      console.log(`   2. Controlla i backup per recuperare i file mancanti`);
      console.log(`   3. Ricarica i file mancanti tramite l'interfaccia web`);
    }

    if (orphanFiles.length > 0) {
      console.log(
        `   4. Esegui 'node scripts/debug-files.js --cleanup' per eliminare i file orfani`
      );
    }

    console.log(`\n✅ Debug completato!`);
  } catch (error) {
    console.error('❌ Errore durante il debug:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

// Funzione per testare la connettività HTTP dei file
const testFileConnectivity = async () => {
  console.log('\n🌐 Test connettività HTTP...');

  const baseUrl = process.env.API_URL || 'http://localhost:5555';
  const axios = require('axios');

  try {
    // Test endpoint principale
    const response = await axios.get(`${baseUrl}/test`);
    console.log(`✅ Server raggiungibile: ${response.data.message}`);

    // Test directory uploads
    const uploadsTest = await axios
      .get(`${baseUrl}/uploads/`)
      .catch((e) => e.response);
    if (uploadsTest && uploadsTest.status === 404) {
      console.log(`✅ Directory uploads configurata (404 atteso per listing)`);
    } else {
      console.log(`⚠️ Directory uploads: status ${uploadsTest?.status}`);
    }

    // Test un file di esempio se presente
    const allEntities = {
      autoveicoli: await Autoveicolo.find({}).limit(1),
      alboGestori: await AlboGestori.find({}).limit(1),
      ren: await REN.find({}).limit(1)
    };

    for (const [entityType, entities] of Object.entries(allEntities)) {
      for (const entity of entities) {
        if (entity.allegati && entity.allegati.length > 0) {
          const allegato = entity.allegati[0];
          let normalizedPath = allegato.percorsoFile.replace(/\\/g, '/');
          if (!normalizedPath.startsWith('uploads/')) {
            const uploadsIndex = normalizedPath.indexOf('uploads');
            if (uploadsIndex >= 0) {
              normalizedPath = normalizedPath.substring(uploadsIndex);
            } else {
              normalizedPath = `uploads/${normalizedPath}`;
            }
          }

          const fileUrl = `${baseUrl}/${normalizedPath}`;
          console.log(`🔗 Testing: ${fileUrl}`);

          try {
            const fileResponse = await axios.head(fileUrl, { timeout: 5000 });
            console.log(
              `✅ File accessibile: ${allegato.nomeFile} (${fileResponse.headers['content-length']} bytes)`
            );
          } catch (error) {
            console.log(
              `❌ File non accessibile: ${allegato.nomeFile} - ${error.message}`
            );
          }

          // Test solo il primo file trovato
          return;
        }
      }
    }

    console.log(`📝 Nessun file di test trovato nel database`);
  } catch (error) {
    console.error(`❌ Errore test connettività: ${error.message}`);
  }
};

// Esegui debug
if (require.main === module) {
  console.log('🚀 Avvio debug file system...');
  console.log('📋 Parametri disponibili:');
  console.log('   --cleanup: Elimina file orfani');
  console.log('   --connectivity: Test connettività HTTP');
  console.log('');

  debugFiles().then(() => {
    if (process.argv.includes('--connectivity')) {
      return testFileConnectivity();
    }
  });
}

module.exports = { debugFiles, testFileConnectivity };
