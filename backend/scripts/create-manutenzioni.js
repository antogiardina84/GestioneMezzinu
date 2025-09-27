const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connesso al database');
};

const createIndexes = async () => {
  try {
    const Manutenzione = require('../models/Manutenzione');
    
    console.log('🔄 Creazione indici per la collezione manutenzioni...');
    
    await Manutenzione.createIndexes();
    
    console.log('✅ Indici creati con successo');
    
    // Verifica indici creati
    const indexes = await Manutenzione.collection.getIndexes();
    console.log('📋 Indici presenti:', Object.keys(indexes));
    
  } catch (error) {
    console.error('❌ Errore creazione indici:', error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await createIndexes();
    
    console.log('🎉 Setup manutenzioni completato!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Errore:', error);
    process.exit(1);
  }
};

main();