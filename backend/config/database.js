const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB connesso con successo');

    // Gestione degli eventi di connessione
    mongoose.connection.on('error', (err) => {
      console.error('Errore MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnesso');
    });

    // Gestione della chiusura del processo
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log(
        'Connessione MongoDB chiusa a causa della chiusura della applicazione'
      );
      process.exit(0);
    });
  } catch (error) {
    console.error('Errore connessione MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
